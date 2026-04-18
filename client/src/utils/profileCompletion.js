/**
 * Client-side profile completion calculator.
 * Must stay in sync with server/utils/profileCompletion.js
 *
 * Freelancer (100%):
 *   base(20) + bio(20) + skills(20) + githubUrl(25) + linkedinUrl(10) + portfolioUrl(5)
 */
export function calcCompletion(role, p) {
  if (!p) return 20
  if (role === 'freelancer') {
    let pct = 20
    if (p.bio) pct += 20
    if (p.skills && p.skills.length > 0) pct += 20
    if (p.githubUrl) pct += 25
    if (p.linkedinUrl) pct += 10
    if (p.portfolioUrl) pct += 5
    return Math.min(100, pct)
  } else {
    if (p.clientType === 'individual') {
      let pct = 20
      if (p.bio) pct += 15
      if (p.avatarUrl) pct += 15
      if (p.location) pct += 15
      if (p.yearsHiring) pct += 15
      if (p.linkedinUrl) pct += 10
      if (p.preferredComm) pct += 10
      return Math.min(100, pct)
    } else if (p.clientType === 'business') {
      let pct = 5
      if (p.bio) pct += 10
      if (p.avatarUrl) pct += 10
      if (p.location) pct += 10
      if (p.yearsHiring) pct += 10
      if (p.companyName) pct += 10
      if (p.industry) pct += 10
      if (p.companySize) pct += 10
      if (p.websiteUrl) pct += 5
      if (p.linkedinUrl) pct += 5
      if (p.preferredComm) pct += 5
      return Math.min(100, pct)
    } else {
      let pct = 20
      if (p.bio) pct += 10
      return Math.min(30, pct)
    }
  }
}
