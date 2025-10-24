import puppeteer, { Browser, Page } from 'puppeteer';
import { storage } from './storage';
import type { Friend, SubmissionStatus } from '@shared/schema';

const TICKET_URL = "https://help.snapchat.com/hc/en-us/requests/new?co=true&ticket_form_id=149423";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface AutomationResult {
  success: boolean;
  requiresCaptcha: boolean;
  error?: string;
}

export class SnapchatAutomation {
  private browser: Browser | null = null;
  private isProcessing = false;
  private shouldStop = false;
  private currentPage: Page | null = null;
  private currentFriend: Friend | null = null;

  async initialize() {
    if (!this.browser) {
      try {
        // Use system Chromium (installed via Nix)
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium';
        
        console.log('🚀 Launching browser with executablePath:', executablePath);
        
        this.browser = await puppeteer.launch({
          headless: false, // Show browser for captcha solving
          executablePath,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
          defaultViewport: { width: 1280, height: 800 },
        });
        
        console.log('✓ Browser initialized successfully');
        
        // Test browser is working by creating and closing a test page
        const testPage = await this.browser.newPage();
        await testPage.close();
        console.log('✓ Browser test page creation successful');
      } catch (error: any) {
        console.error('❌ Failed to initialize browser:', error.message);
        this.browser = null;
        throw new Error(`Browser initialization failed: ${error.message}`);
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async loadCookies(page: Page): Promise<boolean> {
    try {
      const cookies = await storage.getCookies();
      if (!cookies || cookies.length === 0) {
        console.log('No cookies found to load');
        return false;
      }

      await page.goto(TICKET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(1000);
      
      let added = 0;
      for (const cookie of cookies) {
        try {
          const safeCookie: any = {
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
          };
          if (cookie.expires) safeCookie.expires = cookie.expires;
          if (cookie.httpOnly !== undefined) safeCookie.httpOnly = cookie.httpOnly;
          if (cookie.secure !== undefined) safeCookie.secure = cookie.secure;
          
          await page.setCookie(safeCookie);
          added++;
        } catch (err) {
          console.log('Failed to set cookie:', err);
        }
      }

      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(2000);
      console.log(`🗝️ Cookies loaded; ${added}/${cookies.length} applied; attempting bypass.`);
      return true;
    } catch (error) {
      console.error('Error loading cookies:', error);
      return false;
    }
  }

  async saveCookies(page: Page): Promise<void> {
    try {
      const cookies = await page.cookies();
      await storage.saveCookies(cookies);
      console.log('Cookies saved successfully');
    } catch (error) {
      console.error('Error saving cookies:', error);
    }
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    try {
      // Check for Cloudflare Turnstile (most common on Snapchat)
      const hasTurnstile = await page.evaluate(() => {
        const turnstileInputs = document.querySelectorAll('input[name="cf-turnstile-response"]');
        const turnstileIframes = document.querySelectorAll('iframe[src*="cloudflare"]');
        const challengeElements = document.querySelectorAll('[id*="cf-chl"]');
        return turnstileInputs.length > 0 || turnstileIframes.length > 0 || challengeElements.length > 0;
      });

      if (hasTurnstile) {
        console.log('✓ Cloudflare Turnstile CAPTCHA detected');
        return true;
      }

      // Check for common captcha indicators
      const captchaSelectors = [
        'iframe[src*="recaptcha"]',
        'iframe[src*="captcha"]',
        'iframe[src*="hcaptcha"]',
        '.g-recaptcha',
        '#recaptcha',
        '[class*="captcha"]',
        '[id*="captcha"]',
        'div[data-sitekey]', // reCAPTCHA element
        '.cf-turnstile', // Cloudflare Turnstile class
      ];

      for (const selector of captchaSelectors) {
        const element = await page.$(selector);
        if (element) {
          console.log('✓ CAPTCHA detected with selector:', selector);
          return true;
        }
      }

      // Also check for captcha in page content
      const hasCaptchaText = await page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return bodyText.includes('captcha') || 
               bodyText.includes('verify you are human') ||
               bodyText.includes('prove you are not a robot') ||
               bodyText.includes('just a moment') || // Cloudflare challenge page
               bodyText.includes('checking your browser');
      });

      if (hasCaptchaText) {
        console.log('✓ CAPTCHA detected from page text');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error detecting captcha:', error);
      return false;
    }
  }

  async waitForCaptchaSolve(page: Page, timeout = 300000): Promise<boolean> {
    console.log('Waiting for manual CAPTCHA solve...');
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const hasCaptcha = await this.detectCaptcha(page);
      if (!hasCaptcha) {
        console.log('CAPTCHA solved!');
        await this.saveCookies(page);
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('CAPTCHA solve timeout');
    return false;
  }

  async fillField(page: Page, selectors: string[], value: string, fieldName: string, retries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 }).catch(() => null);
          const element = await page.$(selector);
          if (element) {
            console.log(`✓ Found ${fieldName} using selector: ${selector} (attempt ${attempt}/${retries})`);
            
            // Human-like interaction
            await element.click({ delay: 100 });
            await delay(150 + Math.random() * 100);
            
            // Clear existing value
            await element.evaluate((el: any) => {
              if (el.value !== undefined) el.value = '';
              if (el.getAttribute && el.getAttribute('contenteditable') === 'true') {
                el.innerText = '';
              }
            });
            
            // Type with random human-like delays
            for (const char of value) {
              await element.type(char, { delay: 50 + Math.random() * 50 });
            }
            
            // Trigger events
            await element.evaluate((el: any, val: string) => {
              if (el.getAttribute && el.getAttribute('contenteditable') === 'true') {
                el.focus();
                el.innerText = val;
              } else {
                el.focus();
                el.value = val;
              }
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.dispatchEvent(new Event('blur', { bubbles: true }));
            }, value);

            await delay(300 + Math.random() * 200);
            return true;
          }
        } catch (error) {
          console.log(`⚠ Selector ${selector} failed for ${fieldName} (attempt ${attempt}/${retries}):`, error);
        }
      }
      
      if (attempt < retries) {
        console.log(`⏳ Retrying to find ${fieldName} after ${attempt} failed attempt(s)...`);
        await delay(1000); // Wait before retry
      }
    }

    console.error(`❌ Could not find field: ${fieldName} after ${retries} attempts`);
    return false;
  }

  async fillForm(page: Page, friend: Friend): Promise<boolean> {
    const settings = await storage.getSettings();
    if (!settings) {
      throw new Error('Settings not configured');
    }

    console.log('Filling form for:', friend.username);

    // Field selectors from your Python code
    const fields = [
      {
        name: 'Username',
        value: settings.username,
        selectors: [
          'input[name="request[custom_fields][24281229]"]',
          '#request_custom_fields_24281229',
          'input[id*="24281229"]',
        ],
      },
      {
        name: 'Email',
        value: settings.email,
        selectors: [
          'input[name="request[custom_fields][24335325]"]',
          '#request_custom_fields_24335325',
          'input[id*="24335325"]',
        ],
      },
      {
        name: 'Phone',
        value: settings.phone,
        selectors: [
          'input[name="request[custom_fields][24369716]"]',
          '#request_custom_fields_24369716',
          'input[id*="24369716"]',
        ],
      },
      {
        name: "Friend's Username",
        value: friend.username,
        selectors: [
          'input[name="request[custom_fields][24369736]"]',
          '#request_custom_fields_24369736',
          'input[id*="24369736"]',
        ],
      },
    ];

    for (const field of fields) {
      const success = await this.fillField(page, field.selectors, field.value, field.name);
      if (!success) {
        return false;
      }
    }

    return true;
  }

  async submitForm(page: Page): Promise<boolean> {
    const submitSelectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      'input[name="commit"]',
      'button[name="commit"]',
      'button:has-text("Submit")',
      'button:has-text("Send")',
      'input[value*="Submit"]',
      'input[value*="Send"]',
    ];

    console.log('🔍 Looking for submit button...');
    
    // First, try to find using selectors
    for (const selector of submitSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 }).catch(() => null);
        const button = await page.$(selector);
        if (button) {
          const isVisible = await button.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          });
          
          if (isVisible) {
            console.log('✓ Found submit button with selector:', selector);
            await button.click({ delay: 100 });
            console.log('✓ Submit button clicked successfully');
            await delay(2000); // Wait for submission
            return true;
          }
        }
      } catch (error) {
        console.log(`⚠ Submit selector ${selector} failed:`, error);
      }
    }

    // If selectors fail, try to find by evaluating all buttons
    console.log('🔍 Trying to find submit button by evaluating all buttons...');
    try {
      const buttonFound = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
        for (const btn of buttons) {
          const text = btn.textContent?.toLowerCase() || '';
          const value = (btn as HTMLInputElement).value?.toLowerCase() || '';
          const type = (btn as HTMLInputElement).type || '';
          
          if (text.includes('submit') || text.includes('send') || 
              value.includes('submit') || value.includes('send') ||
              type === 'submit') {
            (btn as HTMLElement).click();
            return true;
          }
        }
        return false;
      });

      if (buttonFound) {
        console.log('✓ Submit button clicked via evaluation');
        await delay(2000);
        return true;
      }
    } catch (error) {
      console.log('⚠ Button evaluation failed:', error);
    }

    console.error('❌ Could not find submit button with any method');
    
    // Take screenshot for debugging
    try {
      await page.screenshot({ path: '/tmp/submit-button-not-found.png', fullPage: true });
      console.log('📸 Screenshot saved to /tmp/submit-button-not-found.png');
    } catch (err) {
      console.log('Could not save screenshot:', err);
    }
    
    return false;
  }

  async waitForSuccess(page: Page, timeout = 90000): Promise<boolean> {
    try {
      console.log('Waiting for success page...');
      
      await page.waitForFunction(
        () => {
          const successIndicators = [
            document.querySelector('h1[class*="success"]'),
            document.querySelector('[class*="thank"]'),
            document.body.textContent?.toLowerCase().includes('we got your request'),
            document.body.textContent?.toLowerCase().includes('thank you'),
          ];
          return successIndicators.some(indicator => indicator);
        },
        { timeout }
      );

      console.log('Success page detected!');
      return true;
    } catch (error) {
      console.error('Timeout waiting for success page');
      return false;
    }
  }

  async processOneFriend(friend: Friend, onStatusUpdate: (status: SubmissionStatus, message: string) => void): Promise<AutomationResult> {
    if (!this.browser) {
      await this.initialize();
    }

    let page: Page | null = null;
    
    try {
      console.log(`\n🔄 Starting to process ${friend.username}...`);
      console.log('📄 Creating new browser page...');
      page = await this.browser!.newPage();
      this.currentPage = page;
      this.currentFriend = friend;
      console.log('✓ Browser page created successfully');
      
      // Wait for page to be ready before doing anything
      await delay(500);
      onStatusUpdate('running', `Loading Snapchat ticket page for ${friend.username}`);
      
      // Load cookies if available
      console.log('🍪 Attempting to load cookies...');
      const cookiesLoaded = await this.loadCookies(page);
      
      if (!cookiesLoaded) {
        console.log('No cookies loaded, navigating to ticket page...');
        console.log(`🌐 Navigating to ${TICKET_URL}`);
        await page.goto(TICKET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('✓ Navigation complete');
        await delay(2000); // Wait for page to fully load
      } else {
        console.log('✓ Cookies loaded successfully');
      }

      console.log('⏳ Page loaded, waiting for form elements to render...');
      await delay(2000); // Give page time to fully render
      console.log('✓ Wait complete, page should be ready')

      // Debug: Log all input fields on page
      console.log('🔍 Debugging page inputs:');
      const debugInfo = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, textarea');
        return Array.from(inputs).map(el => ({
          tag: el.tagName,
          type: (el as HTMLInputElement).type,
          name: (el as HTMLInputElement).name,
          id: el.id,
          placeholder: (el as HTMLInputElement).placeholder,
        }));
      });
      console.log('Found inputs:', JSON.stringify(debugInfo, null, 2));

      // Check for captcha before filling form
      const hasCaptcha = await this.detectCaptcha(page);
      if (hasCaptcha) {
        console.log('⚠️ CAPTCHA detected before form filling');
        console.log('📸 Taking screenshot of CAPTCHA page...');
        try {
          await page.screenshot({ path: '/tmp/captcha-detected.png', fullPage: true });
          console.log('Screenshot saved to /tmp/captcha-detected.png');
        } catch (err) {
          console.log('Could not save screenshot:', err);
        }
        
        onStatusUpdate('captcha', `CAPTCHA detected for ${friend.username} - please solve it in the browser window`);
        
        // Keep checking screenshots every 2 seconds so the user can monitor progress
        const captchaCheckInterval = setInterval(async () => {
          try {
            if (page) {
              await page.screenshot({ path: '/tmp/current-page.png', fullPage: false });
            }
          } catch (err) {
            // Ignore errors during periodic screenshots
          }
        }, 2000);
        
        const solved = await this.waitForCaptchaSolve(page, 300000); // 5 minutes
        clearInterval(captchaCheckInterval);
        
        if (!solved) {
          return { success: false, requiresCaptcha: true, error: 'CAPTCHA not solved within timeout' };
        }
        
        console.log('✓ CAPTCHA solved, proceeding with form');
        console.log('⏳ Waiting for form to load after CAPTCHA solve...');
        
        // Don't reload - just wait longer for the form to appear after CAPTCHA is solved
        await delay(5000); // Give extra time for form to load
        
        // Verify form fields are actually present now
        const formPresent = await page.evaluate(() => {
          const inputs = document.querySelectorAll('input[name^="request[custom_fields]"]');
          return inputs.length > 0;
        });
        
        if (!formPresent) {
          console.log('⚠️ Form not loaded after CAPTCHA, reloading page...');
          await page.goto(TICKET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
          await delay(3000);
        } else {
          console.log('✓ Form fields detected after CAPTCHA solve');
        }
      }

      // Fill form with retry logic
      console.log('📝 Filling form fields...');
      onStatusUpdate('running', `Filling form fields for ${friend.username}`);
      
      // Wait for at least one form field to be visible before attempting to fill
      console.log('⏳ Waiting for form fields to be ready...');
      const formFieldsReady = await page.waitForFunction(
        () => {
          const formInputs = document.querySelectorAll('input[name^="request[custom_fields]"]');
          return formInputs.length > 0;
        },
        { timeout: 30000 }
      ).catch(() => null);
      
      if (!formFieldsReady) {
        console.error('❌ Form fields never appeared');
        try {
          await page.screenshot({ path: '/tmp/form-not-loaded.png', fullPage: true });
          console.log('📸 Screenshot saved to /tmp/form-not-loaded.png');
        } catch (err) {
          console.log('Could not save screenshot:', err);
        }
        return { success: false, requiresCaptcha: false, error: 'Form fields did not load' };
      }
      
      console.log('✓ Form fields are ready, proceeding to fill...');
      const formFilled = await this.fillForm(page, friend);
      if (!formFilled) {
        console.error('❌ Failed to fill form fields');
        // Take screenshot for debugging
        try {
          await page.screenshot({ path: '/tmp/form-fill-failed.png', fullPage: true });
          console.log('📸 Screenshot saved to /tmp/form-fill-failed.png');
        } catch (err) {
          console.log('Could not save screenshot:', err);
        }
        return { success: false, requiresCaptcha: false, error: 'Failed to fill form fields' };
      }

      console.log('✓ Form filled successfully');
      await delay(1000);

      // Check for captcha again before submitting
      const hasCaptchaBeforeSubmit = await this.detectCaptcha(page);
      if (hasCaptchaBeforeSubmit) {
        console.log('⚠️ CAPTCHA appeared after form filling');
        onStatusUpdate('captcha', `CAPTCHA appeared - please solve it to continue`);
        const solved = await this.waitForCaptchaSolve(page, 300000);
        if (!solved) {
          return { success: false, requiresCaptcha: true, error: 'CAPTCHA not solved within timeout' };
        }
        await delay(1000);
      }

      // Submit form
      console.log('📤 Submitting form...');
      onStatusUpdate('running', `Submitting form for ${friend.username}`);
      
      // Take screenshot before submission
      try {
        await page.screenshot({ path: '/tmp/before-submit.png', fullPage: true });
        console.log('📸 Before-submit screenshot saved to /tmp/before-submit.png');
      } catch (err) {
        console.log('Could not save before-submit screenshot:', err);
      }
      
      const submitted = await this.submitForm(page);
      if (!submitted) {
        console.error('❌ Failed to find/click submit button');
        return { success: false, requiresCaptcha: false, error: 'Failed to submit form' };
      }

      console.log('✓ Submit button clicked, waiting for success page...');
      onStatusUpdate('running', `Waiting for confirmation for ${friend.username}`);

      // Wait for success
      const success = await this.waitForSuccess(page, 120000); // 2 minutes
      if (success) {
        console.log('✅ Success page detected!');
        await this.saveCookies(page);
        onStatusUpdate('success', `Successfully submitted restoration request for ${friend.username}`);
        
        // Take success screenshot
        try {
          await page.screenshot({ path: '/tmp/success-page.png', fullPage: true });
          console.log('📸 Success screenshot saved to /tmp/success-page.png');
        } catch (err) {
          console.log('Could not save success screenshot:', err);
        }
        
        return { success: true, requiresCaptcha: false };
      } else {
        console.error('❌ Success page not detected');
        const currentUrl = page.url();
        const pageText = await page.evaluate(() => document.body.textContent?.substring(0, 500));
        console.log('Current URL:', currentUrl);
        console.log('Page text preview:', pageText);
        
        // Take screenshot of failure
        try {
          await page.screenshot({ path: '/tmp/success-not-found.png', fullPage: true });
          console.log('📸 Screenshot saved to /tmp/success-not-found.png');
        } catch (err) {
          console.log('Could not save screenshot:', err);
        }
        
        return { success: false, requiresCaptcha: false, error: 'Success page not detected' };
      }

    } catch (error: any) {
      console.error('❌ CRITICAL ERROR processing friend:', error);
      console.error('Error stack:', error.stack);
      
      // Take screenshot of error state
      if (page) {
        try {
          await page.screenshot({ path: '/tmp/critical-error.png', fullPage: true });
          console.log('📸 Error screenshot saved to /tmp/critical-error.png');
          const url = page.url();
          console.log('Page URL at time of error:', url);
        } catch (err) {
          console.log('Could not save error screenshot:', err);
        }
      }
      
      onStatusUpdate('failed', `Error: ${error.message}`);
      return { success: false, requiresCaptcha: false, error: error.message };
    } finally {
      if (page && page === this.currentPage) {
        console.log('🧹 Closing browser page...');
        await page.close().catch(err => console.error('Error closing page:', err));
        this.currentPage = null;
        this.currentFriend = null;
        console.log('✓ Page closed');
      }
      console.log(`✅ Finished processing ${friend.username}\n`);
    }
  }

  async processBatch(friendIds: string[], onStatusUpdate: (friendId: string, status: SubmissionStatus, message: string) => void): Promise<void> {
    this.shouldStop = false;

    try {
      this.isProcessing = true;
      await this.initialize();

      for (const friendId of friendIds) {
        if (this.shouldStop) {
          console.log('Batch processing stopped by user');
          break;
        }

        const friend = await storage.getFriend(friendId);
        if (!friend) {
          console.log('Friend not found:', friendId);
          continue;
        }

        // Create or update submission record
        let submission = await storage.getSubmissionByFriendId(friendId);
        if (!submission) {
          submission = await storage.createSubmission({
            friendId,
            status: 'pending',
            startedAt: null,
            completedAt: null,
            errorMessage: null,
            logEntries: null,
          });
        }

        await storage.updateSubmission(submission.id, {
          status: 'running',
          startedAt: new Date(),
        });

        const result = await this.processOneFriend(friend, (status, message) => {
          onStatusUpdate(friendId, status, message);
        });

        if (result.success) {
          await storage.updateSubmission(submission.id, {
            status: 'success',
            completedAt: new Date(),
          });
        } else if (result.requiresCaptcha) {
          await storage.updateSubmission(submission.id, {
            status: 'captcha',
            errorMessage: result.error,
          });
        } else {
          await storage.updateSubmission(submission.id, {
            status: 'failed',
            completedAt: new Date(),
            errorMessage: result.error,
          });
        }

        // Wait between requests to avoid rate limiting (random delay to appear more human)
        await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
      }
    } finally {
      this.isProcessing = false;
    }
  }

  stopProcessing() {
    this.shouldStop = true;
  }

  getIsProcessing(): boolean {
    return this.isProcessing;
  }

  getCurrentPage(): Page | null {
    return this.currentPage;
  }

  getCurrentFriend(): Friend | null {
    return this.currentFriend;
  }

  async getCurrentScreenshot(): Promise<string | null> {
    if (!this.currentPage) {
      return null;
    }
    try {
      const screenshot = await this.currentPage.screenshot({ encoding: 'base64', fullPage: false });
      return screenshot;
    } catch (error) {
      console.error('Error taking screenshot:', error);
      return null;
    }
  }

  async manualSubmit(): Promise<boolean> {
    if (!this.currentPage) {
      console.error('No active page for manual submit');
      return false;
    }
    console.log('🖱️ Manual submit triggered');
    return await this.submitForm(this.currentPage);
  }

  async manualRefresh(): Promise<boolean> {
    if (!this.currentPage) {
      console.error('No active page for manual refresh');
      return false;
    }
    try {
      console.log('🔄 Manual refresh triggered');
      await this.currentPage.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await delay(2000);
      return true;
    } catch (error) {
      console.error('Error refreshing page:', error);
      return false;
    }
  }
}

export const automation = new SnapchatAutomation();
