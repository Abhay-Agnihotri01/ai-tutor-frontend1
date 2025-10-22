// Install Socket.IO client dependencies
import { execSync } from 'child_process';

console.log('Installing Socket.IO client dependencies...');

try {
  execSync('npm install socket.io-client@^4.7.5', { stdio: 'inherit' });
  console.log('✅ Socket.IO client installed successfully');
} catch (error) {
  console.error('❌ Failed to install Socket.IO client:', error.message);
  process.exit(1);
}