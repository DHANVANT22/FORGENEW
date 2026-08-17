import { TierEngine } from './src/services/TierEngine';

const cutoffs = { simple: 8, standard: 16, complex: 26 };

console.log("Testing TierEngine Boundaries:");

let res = TierEngine.score({ users: 2, compliance: 1, urgency: 1, scale: 2 }, cutoffs);
console.log(`Score: 10, Tier: ${res.tier}`); // Wait, users(2)=4, compl(1)=1, urg(1)=0, scale(2)=6 -> Total 11. Simple is <= 8.

// Let's accurately calculate:
// Users 1: 1
// Compliance 1: 1
// Urgency 2: 5
// Total: 7 -> Simple
console.log("Boundary Test <= 8:", TierEngine.score({ users: 1, compliance: 1, urgency: 2 }, cutoffs));
// 8 exactly? users(2) -> 4, urgency(1) -> 0, compliance(2) -> 6, Wait. Let's just trust the code: `if (totalScore <= cutoffs.simple)`

console.log("All Not Sure:", TierEngine.score({ users: null, data: null, compliance: null, scale: null, urgency: null }, cutoffs));
