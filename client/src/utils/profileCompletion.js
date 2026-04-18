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
    if (p.bio?.trim()) pct += 20
    if (Array.isArray(p.skills) && p.skills.length > 0) pct += 20
    if (p.githubUrl?.trim()) pct += 25
    if (p.linkedinUrl?.trim()) pct += 10
    if (p.portfolioUrl?.trim()) pct += 5
    return Math.min(100, pct)
  } else {
    if (p.clientType === 'individual') {
      let pct = 20
      if (p.bio?.trim()) pct += 15
      if (p.avatarUrl?.trim()) pct += 15
      if (p.location?.trim()) pct += 15
      if (p.yearsHiring?.trim()) pct += 15
      if (p.linkedinUrl?.trim()) pct += 10
      if (p.preferredComm?.trim()) pct += 10
      if (p.paymentVerified) pct += 10
      return Math.min(100, pct)
    } else if (p.clientType === 'business') {
      let pct = 5
      if (p.bio?.trim()) pct += 10
      if (p.avatarUrl?.trim()) pct += 10
      if (p.location?.trim()) pct += 10
      if (p.yearsHiring?.trim()) pct += 10
      if (p.companyName?.trim()) pct += 10
      if (p.industry?.trim()) pct += 10
      if (p.companySize?.trim()) pct += 10
      if (p.websiteUrl?.trim()) pct += 5
      if (p.linkedinUrl?.trim()) pct += 5
      if (p.preferredComm?.trim()) pct += 5
      if (p.paymentVerified) pct += 10
      return Math.min(100, pct)
    } else {
      let pct = 20
      if (p.bio?.trim()) pct += 10
      return Math.min(30, pct)
    }
  }
}