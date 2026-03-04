/**
 * Bracket Seeding Script
 *
 * Creates a test bracket document in Firestore with 64 NCAA teams
 * and partially filled picks to verify bracket rendering.
 *
 * Prerequisites:
 * - Run `gcloud auth application-default login` for ADC credentials
 * - Firebase project must be configured (run `pnpm run setup` first)
 *
 * Usage:
 * - npx tsx tools/scripts/seed-bracket.ts
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const WORKSPACE_ROOT = path.resolve(__dirname, '../../');

/**
 * Resolve the Firebase/GCP project ID from multiple sources:
 * 1. firebase.json projectId field
 * 2. GCLOUD_PROJECT environment variable
 * 3. gcloud CLI active project
 */
function resolveProjectId(): string | null {
  // Try firebase.json first
  const firebaseJsonPath = path.join(WORKSPACE_ROOT, 'firebase.json');
  if (fs.existsSync(firebaseJsonPath)) {
    const content = fs.readFileSync(firebaseJsonPath, 'utf-8');
    const config = JSON.parse(content);
    if (config.projectId) {
      return config.projectId;
    }
  }

  // Try environment variable
  if (process.env.GCLOUD_PROJECT) {
    return process.env.GCLOUD_PROJECT;
  }

  // Try gcloud CLI
  try {
    const result = execSync('gcloud config get-value project 2>/dev/null', {
      encoding: 'utf-8',
    }).trim();
    if (result && result !== '(unset)') {
      return result;
    }
  } catch {
    // gcloud CLI not available
  }

  return null;
}

// 64 real NCAA tournament team names
const TEAMS: string[] = [
  'Duke',
  'UConn',
  'Kentucky',
  'Kansas',
  'North Carolina',
  'Gonzaga',
  'Villanova',
  'Michigan State',
  'UCLA',
  'Arizona',
  'Purdue',
  'Baylor',
  'Tennessee',
  'Houston',
  'Alabama',
  'Creighton',
  'Marquette',
  'Texas',
  'Indiana',
  'Illinois',
  'Iowa State',
  'Auburn',
  'San Diego State',
  'Florida Atlantic',
  'Miami',
  'Virginia',
  'Oregon',
  'Wisconsin',
  "Saint Mary's",
  'Memphis',
  'Xavier',
  'TCU',
  'Arkansas',
  'Maryland',
  'West Virginia',
  'Pittsburgh',
  'Colorado State',
  'Clemson',
  'Dayton',
  'BYU',
  'Michigan',
  'Ohio State',
  'Florida',
  'Syracuse',
  'Louisville',
  'Georgetown',
  'LSU',
  'Oklahoma',
  'Texas Tech',
  'Providence',
  'NC State',
  'Iowa',
  'Rutgers',
  'VCU',
  'Drake',
  'New Mexico',
  'Nevada',
  'Boise State',
  'Utah State',
  'Charleston',
  'Furman',
  'Princeton',
  'Oral Roberts',
  'Fairleigh Dickinson',
];

/**
 * Build picks for all of R1, all of R2, and a few R3 matchups.
 * Bracket seeding: teams[0] vs teams[1] in R1_M1, teams[2] vs teams[3] in R1_M2, etc.
 * Winner of R1_M1 and R1_M2 meet in R2_M1, winner of R1_M3 and R1_M4 meet in R2_M2, etc.
 */
function buildPicks(teams: string[]): Record<string, string> {
  const picks: Record<string, string> = {};

  // Round 1: 32 matchups (R1_M1 through R1_M32)
  // teams[0] vs teams[1] -> R1_M1, teams[2] vs teams[3] -> R1_M2, etc.
  const r1Winners: string[] = [];
  for (let i = 0; i < 32; i++) {
    const matchupId = `R1_M${i + 1}`;
    // Pick the first team (higher seed) as the winner
    const winner = teams[i * 2];
    picks[matchupId] = winner;
    r1Winners.push(winner);
  }

  // Round 2: 16 matchups (R2_M1 through R2_M16)
  // Winner of R1_M1 vs Winner of R1_M2 -> R2_M1, etc.
  const r2Winners: string[] = [];
  for (let i = 0; i < 16; i++) {
    const matchupId = `R2_M${i + 1}`;
    // Pick the first team (higher seed) as the winner
    const winner = r1Winners[i * 2];
    picks[matchupId] = winner;
    r2Winners.push(winner);
  }

  // Round 3: Fill in a few picks (Sweet 16) to show partial completion
  // R3_M1 through R3_M4 (out of 8 total)
  for (let i = 0; i < 4; i++) {
    const matchupId = `R3_M${i + 1}`;
    const winner = r2Winners[i * 2];
    picks[matchupId] = winner;
  }

  return picks;
}

async function main() {
  console.log('\n🏀 Bracket Seeding Script\n');

  const projectId = resolveProjectId();

  if (!projectId) {
    console.error('❌ Could not determine Firebase project ID');
    console.error(
      '   Set projectId in firebase.json, GCLOUD_PROJECT env var, or run `gcloud config set project <id>`',
    );
    process.exit(1);
  }

  console.log(`📍 Target Firebase project: ${projectId}`);

  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  const firestore = getFirestore();
  const now = new Date().toISOString();
  const picks = buildPicks(TEAMS);

  const bracketDoc = {
    bracketName: 'Test Bracket',
    userId: 'test-user',
    createdAt: now,
    updatedAt: now,
    teams: TEAMS,
    picks,
  };

  const docId = 'test-bracket-1';

  console.log(`📝 Writing bracket document: brackets/${docId}`);
  console.log(`   Teams: ${TEAMS.length}`);
  console.log(`   Picks: ${Object.keys(picks).length} (R1: 32, R2: 16, R3: 4)`);

  try {
    await firestore.collection('brackets').doc(docId).set(bracketDoc);
    console.log(`\n✅ Bracket seeded successfully!`);
    console.log(`   Document: brackets/${docId}`);
    console.log(`   Bracket Name: ${bracketDoc.bracketName}`);
    console.log(`   User ID: ${bracketDoc.userId}`);
  } catch (error) {
    console.error('❌ Error writing bracket document:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
