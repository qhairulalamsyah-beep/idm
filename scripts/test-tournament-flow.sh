#!/!//**
 * Test Tournament Flow - Idol Meta Tournament Platform
 * 
 * This script tests the complete tournament lifecycle
 */

const bash = ```
# Setup test environment
BASE_URL="${BASE_URL:-http://localhost:3000}"

# Colors
RED='\033[0m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'

# ============================================
# Test 1: Create Tournament as Super Admin
# ============================================
async function testCreateTournament() {
  console.log('\n🎮 Test 1: Creating Tournament as Super Admin...');
  
  const response = await fetch(`${BASE_URL}/api/tournaments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Test Tournament ${Date.now().toISOString()}`,
      division: 'MALE',
      mode: 'GR Arena 3vs3',
      bpm: 'Random 120-140',
      bracketType: 'SINGLE_ELIMINATION',
      maxParticipants: 8,
      startDate: new Date(Date.now().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Pub 1',
      championAmount: 100000,
      runnerUpAmount: 50000,
      thirdPlaceAmount: 25000,
      mvpAmount: 25000,
    }),
  });

  const data = await response.json();
  const tournamentId = data.data?.id;
  console.log(`✅ Tournament created with ID: ${tournamentId}`);
  return tournamentId;
}

// ============================================
# Test 2: User Registration
# ============================================
async function testUserRegistration(tournamentId) {
  console.log('\n📝 Test 2: User Registration...');
');
  
  const users = [
    { name: 'Alpha', phone: '081111111111' },
    { name: 'Bravo', phone: '081222222222' },
    { name: 'Charlie', phone: '081333333333' },
    { name: 'Delta', phone: '081444444444' },
    { name: 'Echo', phone: '081555555555' },
    { name: 'Foxtrot', phone: '081666666666' },
    { name: 'Golf', phone: '081777777777' },
    { name: 'Hotel', phone: '081888888888' },
  ];

  for (const user of users) {
    const response = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tournamentId,
        name: user.name,
        phone: user.phone,
        division: 'MALE',
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log(`   ✅ ${user.name} registered`);
    } else {
      console.log(`   ⚠️ ${user.name}: ${data.error}`);
    }
  }
}

// ============================================
# Test 3: Admin Approve Registrations
# ============================================
async function testApproveRegistrations(tournamentId) {
  console.log('\n📝 Test 3: Approving Registrations...');
');
  
  // Get pending registrations
  const response = await fetch(`${BASE_URL}/api/registrations?tournamentId=${tournamentId}&status=PENDING`);
  const pendingRegs = await response.json();
  
  console.log(`   Found ${pendingRegs.data?.length || 0} pending registrations`);
  
  if (!pendingRegs.data?.length) {
    console.log('   ⚠️ No pending registrations to approve');
    return;
  }
  
  // Approve each registration with tier
  let approved = 0;
  for (const reg of pendingRegs.data) {
    // Assign tier based on registration order
    const tiers = ['S', 'A', 'B'];
    const assignedTier = tiers[approved % tiers.length];
    
    const response = await fetch(`${BASE_URL}/api/registrations/${reg.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'APPROVED',
        tier: assignedTier,
      }),
    });

    if (response.ok) {
      console.log(`   ✅ Approved ${reg.user?.name} with Tier ${assignedTier}`);
      approved++;
    }
  }
  
  console.log(`\n   Total approved: ${approved}`);
}

// ============================================
# Test 4: Generate Teams
# ============================================
async function testGenerateTeams(tournamentId) {
  console.log('\n📝 Test 4: Generating Teams...');
');
  
  const response = await fetch(`${BASE_URL}/api/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tournamentId,
      generate: true,
    }),
  });

  const data = await response.json();
  if (data.success) {
    console.log(`✅ Generated ${data.data.length} teams`);
    data.data.forEach((team: any, i: number) => {
      console.log(`   Team ${i + 1}: ${team.name} (${team.members?.length} members)`);
    });
    return data.data;
  }
  console.log(`   ❌ Failed to generate teams:`, data.error);
  return [];
}

// ============================================
# Test 5: Generate Bracket
# ============================================
async function testGenerateBracket(tournamentId) {
  console.log('\n📝 Test 5: Generating Bracket...');
');
  
  const response = await fetch(`${BASE_URL}/api/brackets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tournamentId,
    }),
  });

  const data = await response.json();
  if (data.success) {
    console.log(`✅ Bracket generated with ${data.data?.rounds || 1} rounds`);
    return data.data;
  }
  console.log(`   ❌ Failed to generate bracket:`, data.error);
  return null;
}

// ============================================
# Test 6: Get Matches and# ============================================
async function testGetMatches(tournamentId) {
  console.log('\n📝 Test 6: Getting Matches...');
');
  
  const response = await fetch(`${BASE_URL}/api/brackets?tournamentId=${tournamentId}`);
  const data = await response.json();
  
  if (data.success && data.data?.[0]?.matches) {
    const matches = data.data[0].matches;
    console.log(`✅ Found ${matches.length} matches`);
    return matches;
  }
  console.log(`   ⚠️ No matches found`);
  return [];
}

// ============================================
# Test 7: Update Match Score
# ============================================
async function testScoring(tournamentId) {
  console.log('\n📝 Test 7: Testing Scoring...');
');
  
  // Get bracket matches
  const matches = await testGetMatches(tournamentId);
  
  if (!matches?.length) {
    console.log('   ⚠️ No matches to score');
    return;
  }
  
  // Simulate scoring for first 2 matches
  let scored = 0;
  for (let i = 0; i < Math.min(2, matches.length); i++) {
    const match = matches[i];
    
    if (!match.homeTeamId || !match.awayTeamId) {
      console.log(`   Skipping match ${match.matchNumber} (no teams)`);
      continue;
    }
    
    // Random score
    const homeScore = Math.floor(Math.random() * 3);
    const awayScore = Math.floor(Math.random() * 3);
    const winnerId = homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
    
    const response = await fetch(`${BASE_URL}/api/matches/${match.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeScore,
        awayScore,
        winnerId,
        status: 'COMPLETED',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Match ${match.matchNumber}: ${match.homeTeam?.name || 'TBD'} ${homeScore} - ${awayScore} ${match.awayTeam?.name || 'TBD'}`);
      scored++;
    }
  }
  
  console.log(`\n   Total matches scored: ${scored}`);
}

// ============================================
# Test 8: Finalize Tournament
# ============================================
async function testFinalize(tournamentId) {
  console.log('\n📝 Test 8: Finalizing Tournament...');
');
  
  const response = await fetch(`${BASE_URL}/api/tournaments/${tournamentId}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (data.success) {
    console.log(`✅ Tournament finalized!`);
    console.log(`   🏆 Champion: ${data.data?.championTeam?.name || 'TBD'}`);
    console.log(`   🥈 Runner-up: ${data.data?.runnerUpTeam?.name || 'TBD'}`);
    return data.data;
  }
  console.log(`   ⚠️ Failed to finalize:`, data.error);
  return null;
}

// ============================================
# Main Test Runner
# ============================================
async function runTests() {
  console.log('==========================================');
  console.log('   IDOL META TOURNAMENT FLOW TEST');
  console.log('==========================================\n');
  
  try {
    // Test 1: Create Tournament
    const tournamentId = await testCreateTournament();
    if (!tournamentId) {
      console.log('\n❌ Cannot proceed without tournament');
      return;
    }
    
    // Test 2: Register Users
    await testUserRegistration(tournamentId);
    
    // Test 3: Approve Registrations
    await testApproveRegistrations(tournamentId);
    
    // Test 4: Generate Teams
    const teams = await testGenerateTeams(tournamentId);
    if (!teams?.length) {
      console.log('\n❌ Cannot proceed without teams');
      return;
    }
    
    // Test 5: Generate Bracket
    const bracket = await testGenerateBracket(tournamentId);
    if (!bracket) {
      console.log('\n❌ Cannot proceed without bracket');
      return;
    }
    
    // Test 6: Scoring
    await testScoring(tournamentId);
    
    // Test 7: Finalize
    const result = await testFinalize(tournamentId);
    
    console.log('\n==========================================');
    console.log('   ALL TESTS COMPLETED!');
    console.log('==========================================');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Run all tests
runTests();
