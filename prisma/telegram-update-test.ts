import 'dotenv/config';
import axios from 'axios';

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error(
      'TELEGRAM_BOT_TOKEN tidak ditemukan di .env',
    );
  }

  console.log('=== RAW TELEGRAM CALLBACK TEST ===');
  console.log(
    'Sekarang klik tombol "Tambah ke Keranjang" SATU KALI di Telegram.',
  );
  console.log('Menunggu maksimal 30 detik...\n');

  const response = await axios.get(
    `https://api.telegram.org/bot${token}/getUpdates`,
    {
      params: {
        timeout: 25,
        allowed_updates: ['callback_query'],
      },
      timeout: 30000,
    },
  );

  console.log('=== RAW RESULT ===');

  console.dir(response.data, {
    depth: null,
  });
}

main().catch((error) => {
  console.error('=== TEST ERROR ===');

  console.error(
    error instanceof Error
      ? error.message
      : String(error),
  );
});