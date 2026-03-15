/**
 * Bracket Seeding Script
 * Creates a test bracket document in Firestore for visual testing.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const WORKSPACE_ROOT = path.resolve(__dirname, '../../');
const BRACKET_ID = 'test-bracket-1';

function getProjectIdFromFirebaseJson(): string | null {
  const firebaseJsonPath = path.join(WORKSPACE_ROOT, 'firebase.json');
  if (!fs.existsSync(firebaseJsonPath)) {
    return null;
  }
  const content = fs.readFileSync(firebaseJsonPath, 'utf-8');
  const config = JSON.parse(content);
  return config.projectId ?? null;
}

// 64 teams in bracket matchup order (adjacent pairs = R1 matchups)
// 4 regions x 8 matchups per region (1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15)
const TEAMS = [
  // Region 1 (East)
  'Duke',
  'Norfolk St',
  'Memphis',
  'Florida Atlantic',
  'Gonzaga',
  'McNeese',
  'Arizona',
  'Vermont',
  'Clemson',
  'New Mexico',
  'Purdue',
  'High Point',
  'Wisconsin',
  'Montana',
  'Texas Tech',
  'UConn',
  // Region 2 (West)
  'Houston',
  'SIU Edwardsville',
  'Iowa St',
  'Lipscomb',
  'Michigan St',
  'Bryant',
  'Marquette',
  'Western Carolina',
  'Oregon',
  'Liberty',
  'Tennessee',
  'Wofford',
  "Saint Mary's",
  'Grand Canyon',
  'Alabama',
  'Robert Morris',
  // Region 3 (South)
  'Auburn',
  'Alabama St',
  'BYU',
  'VCU',
  'Illinois',
  'Troy',
  'Kentucky',
  'Colgate',
  'UCLA',
  'UC San Diego',
  'Florida',
  'Norfolk',
  'Baylor',
  'Akron',
  'Kansas',
  'Arkansas',
  // Region 4 (Midwest)
  'North Carolina',
  'Merrimack',
  'Boise St',
  'SMU',
  'Maryland',
  'Grand Canyon St',
  'Creighton',
  'UC Irvine',
  'Ole Miss',
  'Dayton',
  'Michigan',
  'UC Davis',
  'San Diego St',
  'Louisville',
  'Texas A&M',
  'Drake',
];

// Picks: complete through Round 3, partial Round 4, empty R5-R6
function makePicks(): Record<string, string> {
  const picks: Record<string, string> = {};

  // R1: top team wins in all 32 matchups
  for (let m = 0; m < 32; m++) {
    picks[`R1_M${m + 1}`] = TEAMS[m * 2];
  }

  // R2: top team (winner of odd matchup) wins in all 16
  for (let m = 0; m < 16; m++) {
    picks[`R2_M${m + 1}`] = picks[`R1_M${m * 2 + 1}`];
  }

  // R3: top team wins in all 8 (Sweet 16)
  for (let m = 0; m < 8; m++) {
    picks[`R3_M${m + 1}`] = picks[`R2_M${m * 2 + 1}`];
  }

  // R4: only first 2 of 4 matchups picked (Elite 8 — partial)
  picks.R4_M1 = picks.R3_M1;
  picks.R4_M2 = picks.R3_M3;

  // R5 and R6 left empty to test TBD state

  return picks;
}

async function main() {
  console.log('\n🏀 Bracket Seeding Script\n');

  const projectId = getProjectIdFromFirebaseJson();
  if (!projectId) {
    console.error('❌ No projectId found in firebase.json');
    console.error('   Run the setup script first: pnpm run setup');
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
  const picks = makePicks();

  console.log(`📝 Writing bracket "${BRACKET_ID}"...`);
  console.log(`   Teams: ${TEAMS.length}`);
  console.log(`   Picks: ${Object.keys(picks).length} of 63`);

  await firestore.collection('brackets').doc(BRACKET_ID).set({
    bracketName: "Nick's March Madness Picks",
    userId: 'seed-user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    teams: TEAMS,
    picks,
  });

  console.log(`\n✅ Bracket seeded successfully!`);
  console.log(`   View at: /brackets/${BRACKET_ID}\n`);
}

main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
