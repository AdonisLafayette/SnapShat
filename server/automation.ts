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

  async initialize() {
    if (!this.browser) {
      // Use system Chromium (installed via Nix)
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium';
      
      this.browser = await puppeteer.launch({
        headless: false, // Show browser for captcha solving
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
        defaultViewport: { width: 1280, height: 800 },
      });
      
      console.log('✓ Browser initialized successfully with Chromium');
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
      // Check for common captcha indicators
      const captchaSelectors = [
        'iframe[src*="recaptcha"]',
        'iframe[src*="captcha"]',
        '.g-recaptcha',
        '#recaptcha',
        '[class*="captcha"]',
      ];

      for (const selector of captchaSelectors) {
        const element = await page.$(selector);
        if (element) {
          console.log('CAPTCHA detected:', selector);
          return true;
        }
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

  async fillField(page: Page, selectors: string[], value: string, fieldName: string): Promise<boolean> {
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 }).catch(() => null);
        const element = await page.$(selector);
        if (element) {
          console.log(`✓ Found ${fieldName} using selector: ${selector}`);
          
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
        console.log(`⚠ Selector ${selector} failed for ${fieldName}:`, error);
      }
    }

    console.error(`❌ Could not find field: ${fieldName}`);
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
    ];

    for (const selector of submitSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          console.log('Clicking submit button:', selector);
          await button.click();
          await delay(1000);
          return true;
        }
      } catch (error) {
        console.log(`Submit selector ${selector} failed:`, error);
      }
    }

    console.error('Could not find submit button');
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
      page = await this.browser!.newPage();
      
      // Wait for page to be ready before doing anything
      await delay(500);
      console.log(`\n🔄 Processing ${friend.username}...`);
      onStatusUpdate('running', `Loading Snapchat ticket page for ${friend.username}`);
      
      // Load cookies if available
      const cookiesLoaded = await this.loadCookies(page);
      
      if (!cookiesLoaded) {
        console.log('No cookies loaded, navigating to ticket page...');
        await page.goto(TICKET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await delay(2000); // Wait for page to fully load
      }

      console.log('Page loaded, waiting for form elements...');
      await delay(2000); // Give page time to fully render

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
        onStatusUpdate('captcha', `CAPTCHA detected for ${friend.username} - please solve it in the browser window`);
        const solved = await this.waitForCaptchaSolve(page, 300000); // 5 minutes
        if (!solved) {
          return { success: false, requiresCaptcha: true, error: 'CAPTCHA not solved within timeout' };
        }
        console.log('✓ CAPTCHA solved, proceeding with form');
        // Reload page after CAPTCHA to ensure clean state
        await page.goto(TICKET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await delay(3000); // Extra wait for dynamic content to load
      }

      // Fill form
      console.log('📝 Filling form fields...');
      onStatusUpdate('running', `Filling form fields for ${friend.username}`);
      const formFilled = await this.fillForm(page, friend);
      if (!formFilled) {
        console.error('❌ Failed to fill form fields');
        // Save page HTML for debugging
        const html = await page.content();
        console.log('Page HTML length:', html.length);
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
      const submitted = await this.submitForm(page);
      if (!submitted) {
        console.error('❌ Failed to find/click submit button');
        return { success: false, requiresCaptcha: false, error: 'Failed to submit form' };
      }

      console.log('✓ Submit button clicked, waiting for success page...');

      // Wait for success
      const success = await this.waitForSuccess(page, 120000); // 2 minutes
      if (success) {
        console.log('✅ Success page detected!');
        await this.saveCookies(page);
        onStatusUpdate('success', `Successfully submitted restoration request for ${friend.username}`);
        return { success: true, requiresCaptcha: false };
      } else {
        console.error('❌ Success page not detected');
        const currentUrl = page.url();
        const pageText = await page.evaluate(() => document.body.textContent?.substring(0, 500));
        console.log('Current URL:', currentUrl);
        console.log('Page text:', pageText);
        return { success: false, requiresCaptcha: false, error: 'Success page not detected' };
      }

    } catch (error: any) {
      console.error('❌ Error processing friend:', error);
      return { success: false, requiresCaptcha: false, error: error.message };
    } finally {
      if (page) {
        await page.close().catch(err => console.error('Error closing page:', err));
      }
      console.log(`Finished processing ${friend.username}\n`);
    }
  }

  async processBatch(friendIds: string[], onStatusUpdate: (friendId: string, status: SubmissionStatus, message: string) => void): Promise<void> {
    this.isProcessing = true;
    this.shouldStop = false;

    try {
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
}

export const automation = new SnapchatAutomation();
