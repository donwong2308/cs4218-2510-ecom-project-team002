# Milestone 3 - Non-Functional Testing Team Coordination
## Test Type Assignment Tracker

**Project:** E-Commerce Application (cs4218-2510-ecom-project-team002)  
**Milestone:** Milestone 3 - Performance Testing (4%)  
**Date:** October 27, 2025

---

## Team Member Test Type Assignments

| Team Member | Test Type | Status | Notes |
|-------------|-----------|--------|-------|
| **Donavon** | **Stress Testing** | ✅ **CLAIMED** | Focus: Breaking points, failure behavior, system limits beyond normal capacity |
| Member 2 | TBD | 🟡 Pending | Available: Load, Performance, Endurance, Capacity, Security |
| Member 3 | TBD | 🟡 Pending | Available: Load, Performance, Endurance, Capacity, Security |
| Member 4 | TBD | 🟡 Pending | Available: Load, Performance, Endurance, Capacity, Security |
| Member 5 | TBD | 🟡 Pending | Available: Load, Performance, Endurance, Capacity, Security |

---

## Test Type Definitions & Boundaries

### ✅ **Stress Testing** (CLAIMED by Donavon)

**Focus:** Push system BEYOND normal operational capacity to find breaking points

**What I'm Testing:**
- ✅ Breaking point discovery (exact user count when system fails)
- ✅ Failure behavior (how system fails: crash, hang, degradation)
- ✅ System absolute limits (maximum before catastrophic failure)
- ✅ Recovery capability (self-healing after stress removed)
- ✅ Failure cascade patterns (which components fail first)

**What I'm NOT Testing (Available for teammates):**
- ❌ Response time optimization at normal load → **Performance Testing**
- ❌ Sustained load at sustainable capacity → **Load Testing**
- ❌ Long-duration stability (24+ hours) → **Endurance Testing**
- ❌ Maximum sustainable capacity → **Capacity Testing**
- ❌ Security vulnerabilities → **Security Testing**

**Key Differentiator:** I'm intentionally breaking the system, not measuring optimal performance.

---

### 🔴 **Load Testing** (AVAILABLE)

**Focus:** Test system behavior under EXPECTED load conditions

**Tests:**
- Normal concurrent user capacity (e.g., 50-200 users)
- Response times at realistic load levels
- Throughput at expected capacity
- System stability under typical traffic

**Differentiator from Stress:** Tests WITHIN normal capacity, not beyond breaking point.

---

### 🔵 **Performance Testing** (AVAILABLE)

**Focus:** Measure and benchmark response times, throughput under normal conditions

**Tests:**
- API response time benchmarks
- Database query performance
- Network latency measurements
- Resource utilization at normal load

**Differentiator from Stress:** Focuses on optimization at reasonable loads, not failure discovery.

---

### 🟢 **Endurance Testing** (AVAILABLE)

**Focus:** Long-duration stability testing at sustainable load

**Tests:**
- 24-48 hour sustained load at moderate levels
- Memory leak detection over time
- Gradual performance degradation
- Resource accumulation issues

**Differentiator from Stress:** Time-based (hours/days), not pushing to failure.

---

### 🟡 **Capacity Testing** (AVAILABLE)

**Focus:** Find maximum SUSTAINABLE capacity

**Tests:**
- Maximum users system can handle while maintaining SLAs
- Scalability limits (when to add resources)
- Optimal capacity planning
- Infrastructure sizing recommendations

**Differentiator from Stress:** Finds optimal capacity, not breaking point.

---

### 🟣 **Security Testing** (AVAILABLE)

**Focus:** Identify security vulnerabilities

**Tests:**
- SQL injection, XSS attacks
- Authentication/authorization flaws
- OWASP Top 10 vulnerabilities
- Penetration testing

**Tools:** OWASP ZAP, Burp Suite, etc.

**Differentiator from Stress:** Security focus, not performance/capacity focus.

---

## Coordination Checklist

### For Donavon (Stress Testing):
- ✅ Test type: **Stress Testing** (breaking points & failure behavior)
- ✅ Scope documented: Push beyond normal capacity to failure
- ✅ Boundaries defined: NOT doing load/performance/endurance/capacity testing
- ✅ Tools: Apache JMeter with Stepping Thread Group
- ✅ Key deliverable: Breaking point report with failure analysis

### For Team Members (To Do):
- ⬜ Confirm your test type selection
- ⬜ Ensure no duplication with Donavon's Stress Testing
- ⬜ Document your test scope and boundaries
- ⬜ Update this document with your assignments

---

## Test Type Selection Guidelines

**How to Choose:**
1. Check this document to see what's available
2. Select ONE test type not already claimed
3. Update the table above with your name and test type
4. Document your specific scope to avoid overlap
5. Get team confirmation before proceeding

**Remember:**
- Each test type must be unique per team member
- Quality of approach matters more than complexity
- Clear boundaries prevent scope overlap
- Document your rationale for test type selection

---

## Communication Protocol

**Before Starting Testing:**
1. Claim your test type in this document
2. Share with team for confirmation
3. Wait for acknowledgment (no conflicts)
4. Proceed with test design

**If Conflict Arises:**
1. First person to document claim gets priority
2. Others must select different test type
3. Update document immediately

---

## Key Dates & Deadlines

| Milestone | Date | Status |
|-----------|------|--------|
| Test type selection & team coordination | Oct 27, 2025 | ✅ In Progress |
| Test plan design | Oct 28-29, 2025 | 🟡 Upcoming |
| Test execution | Oct 30-Nov 1, 2025 | 🟡 Upcoming |
| Results analysis | Nov 2-3, 2025 | 🟡 Upcoming |
| Report writing | Nov 4-5, 2025 | 🟡 Upcoming |
| Final submission | Nov 6, 2025 | 🟡 Upcoming |

---

## Contact Information

**For Questions/Conflicts:**
- Team Lead: [Name]
- Email: [Email]
- Group Chat: [Platform]

**Donavon's Contact:**
- Focus: Stress Testing
- Available for: Questions about stress testing scope, JMeter setup
- NOT available for: Other test types (to avoid scope creep)

---

## Appendix: Quick Reference

### Donavon's Stress Testing Scope (Quick Summary):

**Will Test:**
- Breaking point: 100 → 500 concurrent users until system fails
- Failure modes: Authentication (bcrypt CPU), Database (connection pool), Memory exhaustion
- Recovery: System self-healing capability

**Will NOT Test:**
- Normal capacity performance (Load Testing)
- Response time benchmarks (Performance Testing)
- 24-hour stability (Endurance Testing)
- Optimal capacity (Capacity Testing)

**Expected Outcome:**
- System will fail around 200-300 concurrent users
- Authentication will fail first due to bcrypt CPU bottleneck
- Report will focus on failure prevention recommendations

---

**Document Status:** Active  
**Last Updated:** October 27, 2025  
**Next Update:** After team confirmation

**Action Required:** Team members must claim their test types ASAP to avoid conflicts!
