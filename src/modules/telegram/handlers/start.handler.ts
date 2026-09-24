import { Injectable } from '@nestjs/common';
import { MainMenuHandler } from './main-menu.handler';
import { TelegramService } from '../telegram.service';

@Injectable()
export class StartHandler {
  constructor(
    private readonly mainMenuHandler: MainMenuHandler,
    private readonly telegramService: TelegramService,
  ) {}

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private terminal(
    title: string,
    lines: string[],
    footer: string,
    percent?: number,
    bar?: string,
  ): string {
    const output = [
      '<pre>',
      `N0ZTECH:// ${title}`,
      '--------------------------------',
      ...lines.map((line) => `> ${line}`),
    ];

    if (percent !== undefined && bar) {
      output.push(
        '--------------------------------',
        `${bar} ${percent}%`,
      );
    }

    output.push('', footer, '</pre>');

    return output.join('\n');
  }

  async handle(
    chatId: number,
    firstName?: string,
  ): Promise<void> {
    /*
     * V5.5 FINAL POLISH
     * BOOT -> NODE -> BREACH -> DECRYPT -> ROOT
     */

    const frames = [
      // ==========================================
      // INSTANT BOOT
      // ==========================================

      {
        text: this.terminal(
          'BOOT_SEQUENCE',
          [
            'BOOT_SEQUENCE.EXE',
            'MEMORY ............ OK',
            'CORE .............. INIT',
          ],
          'exec:// boot',
          5,
          '[#.........]',
        ),
        delay: 120,
      },

      {
        text: this.terminal(
          'BOOT_SEQUENCE',
          [
            'KERNEL ............ OK',
            'NETWORK ........... OK',
            'PORT 443 .......... OPEN',
          ],
          'exec:// connect node',
          14,
          '[##........]',
        ),
        delay: 120,
      },

      // ==========================================
      // NODE DISCOVERY
      // ==========================================

      {
        text: this.terminal(
          'NODE_DISCOVERY',
          [
            'SCANNING .......... ACTIVE',
            'NODE .............. 7F-A9-22',
            'SIGNAL ............ LOCKED',
          ],
          'exec:// scan --node',
          24,
          '[##........]',
        ),
        delay: 130,
      },

      {
        text: this.terminal(
          'NODE_DISCOVERY',
          [
            'NODE .............. 7F-A9-22',
            'PACKET ............ ACTIVE',
            'HANDSHAKE .......... INIT',
          ],
          'exec:// handshake',
          31,
          '[###.......]',
        ),
        delay: 130,
      },

      // ==========================================
      // BREACH
      // ==========================================

      {
        text: this.terminal(
          'BREACH',
          [
            'TARGET ............ N0ZTECH',
            'FIREWALL .......... DETECTED',
            'SECURITY .......... LOCKED',
          ],
          'exec:// breach',
          39,
          '[####......]',
        ),
        delay: 140,
      },

      // Micro corruption
      {
        text: this.terminal(
          'BREACH',
          [
            'TARGET ............ N0ZTECH',
            'FIREWALL .......... DETECTED',
            'SECUR1TY .......... LOCKED',
          ],
          'exec:// breach --force',
          43,
          '[####......]',
        ),
        delay: 55,
      },

      {
        text: this.terminal(
          'BREACH',
          [
            'FIREWALL .......... BYPASS...',
            'SIGNATURE .......... LOCKED',
            'ACCESS ............ DENIED',
          ],
          'exec:// bypass --force',
          49,
          '[#####.....]',
        ),
        delay: 95,
      },

      // Strong glitch
      {
        text: this.terminal(
          'BREACH',
          [
            'FIREWALL .......... BYP4SS',
            'SIGNATURE .......... OVERRIDE',
            'ACCESS ............ PROCESSING',
          ],
          'exec:// override --root',
          54,
          '[#####.....]',
        ),
        delay: 55,
      },

      {
        text: this.terminal(
          'BREACH',
          [
            'FIREWALL .......... BYPASS',
            'SIGNATURE .......... MATCH',
            'ACCESS ............ GRANTED',
          ],
          'exec:// firewall --disabled',
          60,
          '[######....]',
        ),
        delay: 120,
      },

      // ==========================================
      // DECRYPT
      // ==========================================

      {
        text: this.terminal(
          'DECRYPT',
          [
            'CHANNEL ........... AES-256',
            'KEY ............... 91F4',
            'DECRYPT ............ RUN',
          ],
          'decrypt:// channel',
          67,
          '[######....]',
        ),
        delay: 110,
      },

      {
        text: this.terminal(
          'DECRYPT',
          [
            'CHANNEL ........... AES-256',
            'KEY ............... A7F4',
            'D3CRYPT ............ 83%',
          ],
          'decrypt:// stream',
          72,
          '[#######...]',
        ),
        delay: 55,
      },

      {
        text: this.terminal(
          'DECRYPT',
          [
            'CHANNEL ........... AES-256',
            'KEY ............... 91F4',
            'DECRYPT ............ COMPLETE',
          ],
          'decrypt:// channel --ok',
          78,
          '[########..]',
        ),
        delay: 120,
      },

      // ==========================================
      // ROOT
      // ==========================================

      {
        text: this.terminal(
          'ROOT_ACCESS',
          [
            'STORE CORE ........ ONLINE',
            'DATABASE .......... ONLINE',
            'ROOT SHELL ........ INIT',
          ],
          'root@n0ztech:~$ auth',
          85,
          '[########..]',
        ),
        delay: 105,
      },

      // Root corruption
      {
        text: this.terminal(
          'ROOT_ACCESS',
          [
            'STORE CORE ........ ONLINE',
            'DATABASE .......... ONLINE',
            'R00T SHELL ........ OPEN',
          ],
          'root@n0ztech:~$ authenticate',
          90,
          '[#########.]',
        ),
        delay: 55,
      },

      {
        text: this.terminal(
          'ROOT_ACCESS',
          [
            'SESSION ........... VALID',
            'TOKEN ............. ACCEPTED',
            'PRIVILEGE ......... ROOT',
          ],
          'root@n0ztech:~$ verify',
          96,
          '[#########.]',
        ),
        delay: 110,
      },

      // ==========================================
      // ACCESS GRANTED
      // ==========================================

      {
        text: this.terminal(
          'ACCESS_GRANTED',
          [
            'IDENTITY .......... VERIFIED',
            'SECURITY .......... PASSED',
            'STORE ............. ONLINE',
          ],
          'root@n0ztech:~$ _',
          100,
          '[##########]',
        ),
        delay: 150,
      },
    ];

    /*
     * Send loader immediately.
     */
    const loadingMessage =
      await this.telegramService.sendMessage(
        chatId,
        frames[0]!.text,
        undefined,
        'HTML',
      );

    const messageId =
      loadingMessage?.result?.message_id;

    if (!messageId) {
      await this.mainMenuHandler.show(
        chatId,
        firstName,
      );
      return;
    }

    /*
     * Main animation.
     */
    for (
      let index = 1;
      index < frames.length;
      index++
    ) {
      await this.delay(frames[index]!.delay);

      await this.telegramService.editMessageText(
        chatId,
        messageId,
        frames[index]!.text,
        'HTML',
      );
    }

    // ==========================================
    // FINAL IMPACT
    // ==========================================

    const finalFrames = [
      [
        '<pre>',
        'N0ZTECH:// ROOT',
        '--------------------------------',
        '> ACCESS...',
        '> ACCESS GR4NT3D',
        '> S3SSION VALID',
        '',
        '[##########] 100%',
        '',
        'root@n0ztech:~$ _',
        '</pre>',
      ].join('\n'),

      [
        '<pre>',
        'N0ZTECH:// R00T',
        '--------------------------------',
        '> ACC3SS GR4NT3D',
        '> S3SSION V4LID',
        '> ST0RE 0NLINE',
        '',
        '[##########] 100%',
        '',
        'root@n0ztech:~$ _',
        '</pre>',
      ].join('\n'),

      /*
       * Clean impact frame.
       */
      [
        '<pre>',
        'N0ZTECH:// SYSTEM',
        '--------------------------------',
        '> ACCESS GRANTED',
        '> SESSION VALID',
        '> ALL SYSTEMS ONLINE',
        '',
        '[##########] 100%',
        '',
        'root@n0ztech:~$ _',
        '</pre>',
      ].join('\n'),
    ];

    // Glitch 1
    await this.delay(60);

    await this.telegramService.editMessageText(
      chatId,
      messageId,
      finalFrames[0]!,
      'HTML',
    );

    // Glitch 2
    await this.delay(65);

    await this.telegramService.editMessageText(
      chatId,
      messageId,
      finalFrames[1]!,
      'HTML',
    );

    // Clean final frame
    await this.delay(70);

    await this.telegramService.editMessageText(
      chatId,
      messageId,
      finalFrames[2]!,
      'HTML',
    );

    /*
     * Hold final frame briefly so the
     * ACCESS GRANTED moment is visible.
     */
    await this.delay(300);

    await this.telegramService.deleteMessage(
      chatId,
      messageId,
    );

    /*
     * Only after loader disappears,
     * show the main menu.
     */
    await this.mainMenuHandler.show(
      chatId,
      firstName,
    );
  }
}