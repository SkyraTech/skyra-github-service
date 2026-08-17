import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  PORT: parseInt(process.env.PORT || '8001', 10),
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  GITHUB_USERNAME: process.env.GITHUB_USERNAME || '',
  GITHUB_ORG: process.env.GITHUB_ORG || '',
  
  validate() {
    if (!this.GITHUB_TOKEN) {
      throw new Error('❌ Missing GITHUB_TOKEN in environment configuration!');
    }
    if (!this.GITHUB_USERNAME) {
      throw new Error('❌ Missing GITHUB_USERNAME in environment configuration!');
    }
  }
};
