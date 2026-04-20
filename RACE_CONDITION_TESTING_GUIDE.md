# Race Condition Fix - Testing Guide

## 🧪 Complete Testing Protocol

---

## Prerequisites

1. **MongoDB Running**: Ensure MongoDB is running with replica set (required for transactions)
2. **Server Running**: Start the backend server
3. **Test Accounts**: Have multiple driver/captain accounts ready
4. **API Client**: Use Postman, curl, or custom script

---

## Test Suite 1: Spare Driver Race Condition

### Test 1.1: Concurrent Acceptance (Critical)

**Objective**: Verify only one driver can accept a booking

**Steps**:
```bash
# Terminal 1 - Driver A
curl -X POST http://localhost:5000/api/sparedrivers/bookings/BOOKING_ID/accept \
  -H "Authorization: Bearer DRIVER_A_TOKEN" \
  -H "Content-Type: application/json"

# Terminal 2 - Driver B (run simultaneously)
curl -X POST http://localhost:5000/api/sparedrivers/bookings/BOOKING_ID/accept \
  -H "Authorization: Bearer DRIVER_B_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Results**:
- Driver A: `200 OK` with booking data
- Driver B: `409 Conflict` with message "Booking not available - another driver has already accepted this trip"

**Verification**:
```javascript
// Check database
db.bookings.findOne({ _id: ObjectId("BOOKING_ID") })
// Should show:
// - status: "en_route"
// - provider.id: DRIVER_A_ID (only one driver)
// - __v: incremented by 1
```

---

### Test 1.2: Rapid Sequential Requests

**Objective**: Test with 10 concurrent requests

**Script** (`test-race-condition.js`):
```javascript
const axios = require('axios');

const testRaceCondition = async () => {
  const bookingId = 'YOUR_BOOKING_ID';
  const driverTokens = [
    'DRIVER_1_TOKEN',
    'DRIVER_2_TOKEN',
    'DRIVER_3_TOKEN',
    'DRIVER_4_TOKEN',
    'DRIVER_5_TOKEN',
    'DRIVER_6_TOKEN',
    'DRIVER_7_TOKEN',
    'DRIVER_8_TOKEN',
    'DRIVER_9_TOKEN',
    'DRIVER_10_TOKEN'
  ];

  const requests = driverTokens.map(token =>
    axios.post(
      `http://localhost:5000/api/sparedrivers/bookings/${bookingId}/accept`,
      {},
      { 
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true // Don't throw on 4xx/5xx
      }
    )
  );

  const results = await Promise.all(requests);
  
  const successful = results.filter(r => r.status === 200);
  const conflicts = results.filter(r => r.status === 409);
  const errors = results.filter(r => r.status !== 200 && r.status !== 409);

  console.log('=== Test Results ===');
  console.log(`Successful: ${successful.length} (Expected: 1)`);
  console.log(`Conflicts: ${conflicts.length} (Expected: 9)`);
  console.log(`Errors: ${errors.length} (Expected: 0)`);
  
  if (successful.length === 1 && conflicts.length === 9 && errors.length === 0) {
    console.log('✅ TEST PASSED: Race condition prevented!');
  } else {
    console.log('❌ TEST FAILED: Race condition detected!');
  }
};

testRaceCondition();
```

**Run**:
```bash
node test-race-condition.js
```

**Expected Output**:
```
=== Test Results ===
Successful: 1 (Expected: 1)
Conflicts: 9 (Expected: 9)
Errors: 0 (Expected: 0)
✅ TEST PASSED: Race condition prevented!
```

---

### Test 1.3: Transaction Rollback

**Objective**: Verify transaction rolls back on error

**Steps**:
1. Create a booking
2. Modify code temporarily to throw error after findOneAndUpdate
3. Try to accept booking
4. Verify booking status is still 'pending'

**Verification**:
```javascript
// Check database
db.bookings.findOne({ _id: ObjectId("BOOKING_ID") })
// Should show:
// - status: "pending" (unchanged)
// - provider.id: null (no assignment)
```

---

### Test 1.4: Wallet Consistency

**Objective**: Verify wallet operations are atomic

**Steps**:
1. Note driver's wallet balance before
2. Accept booking (should succeed)
3. Check wallet balance after
4. Verify transaction log exists

**Verification**:
```javascript
// Check wallet transaction
db.wallettransactions.find({ 
  user: ObjectId("DRIVER_ID"),
  referenceId: /kit-recovery/
}).sort({ createdAt: -1 }).limit(1)

// Should show proper transaction with:
// - balanceBefore
// - balanceAfter
// - amount
// - status: "completed"
```

---

## Test Suite 2: Captain Race Condition

### Test 2.1: Concurrent Job Acceptance

**Objective**: Verify only one captain can accept a job

**Steps**:
```bash
# Terminal 1 - Captain A
curl -X POST http://localhost:5000/api/captain/jobs/JOB_ID/accept \
  -H "Authorization: Bearer CAPTAIN_A_TOKEN" \
  -H "Content-Type: application/json"

# Terminal 2 - Captain B (run simultaneously)
curl -X POST http://localhost:5000/api/captain/jobs/JOB_ID/accept \
  -H "Authorization: Bearer CAPTAIN_B_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Results**:
- Captain A: `200 OK` with job data
- Captain B: `409 Conflict` with message "Job no longer available or already accepted by another captain"

---

### Test 2.2: Capability Mismatch

**Objective**: Verify capability checks work within transaction

**Steps**:
1. Create a booking requiring 'bus' capability
2. Have a 'car' captain try to accept
3. Verify proper error and no partial updates

**Expected Result**:
- Status: `403 Forbidden`
- Message: "Capability mismatch: This BUS request is not enabled for your captain profile"
- Database: Booking still 'pending', no provider assigned

---

### Test 2.3: Mission Conflict

**Objective**: Verify mission conflict detection works

**Steps**:
1. Captain has an active booking
2. Try to accept another booking
3. Verify proper error

**Expected Result**:
- Status: `403 Forbidden`
- Message: "Mission Conflict: Finish or clear your current..."
- Database: New booking still 'pending'

---

## Test Suite 3: Performance Testing

### Test 3.1: Response Time

**Objective**: Measure transaction overhead

**Script**:
```javascript
const axios = require('axios');

const measurePerformance = async () => {
  const times = [];
  
  for (let i = 0; i < 100; i++) {
    const start = Date.now();
    
    await axios.post(
      'http://localhost:5000/api/sparedrivers/bookings/BOOKING_ID/accept',
      {},
      { headers: { 'Authorization': 'Bearer TOKEN' } }
    ).catch(() => {}); // Ignore errors
    
    const end = Date.now();
    times.push(end - start);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);
  
  console.log(`Average: ${avg}ms`);
  console.log(`Max: ${max}ms`);
  console.log(`Min: ${min}ms`);
};

measurePerformance();
```

**Expected**:
- Average: 50-100ms
- Max: < 200ms
- Overhead from transactions: ~5-10ms (acceptable)

---

### Test 3.2: Load Test

**Objective**: Test under high load

**Using Artillery**:
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Accept Booking"
    flow:
      - post:
          url: "/api/sparedrivers/bookings/{{ bookingId }}/accept"
          headers:
            Authorization: "Bearer {{ token }}"
```

**Run**:
```bash
artillery run artillery-config.yml
```

**Expected**:
- No race conditions
- All conflicts properly handled
- No database inconsistencies

---

## Test Suite 4: Database Verification

### Test 4.1: Version Field

**Objective**: Verify optimistic locking works

**Query**:
```javascript
// Before acceptance
db.bookings.findOne({ _id: ObjectId("BOOKING_ID") }, { __v: 1 })
// __v: 0

// After acceptance
db.bookings.findOne({ _id: ObjectId("BOOKING_ID") }, { __v: 1 })
// __v: 1 (incremented)
```

---

### Test 4.2: Activity Log

**Objective**: Verify activity log is updated

**Query**:
```javascript
db.bookings.findOne(
  { _id: ObjectId("BOOKING_ID") },
  { activityLog: 1 }
)

// Should contain:
// {
//   status: "sparedriver_accepted",
//   description: "Booking accepted by spare driver.",
//   metadata: { driverId: "..." },
//   timestamp: ISODate("...")
// }
```

---

### Test 4.3: Provider Assignment

**Objective**: Verify provider is correctly assigned

**Query**:
```javascript
db.bookings.findOne(
  { _id: ObjectId("BOOKING_ID") },
  { provider: 1 }
)

// Should show:
// {
//   provider: {
//     type: "sparedriver",
//     model: "SpareDriver",
//     id: ObjectId("DRIVER_ID"),
//     name: "Driver Name",
//     phone: "1234567890"
//   }
// }
```

---

## Test Suite 5: Error Scenarios

### Test 5.1: Invalid Booking ID

**Request**:
```bash
curl -X POST http://localhost:5000/api/sparedrivers/bookings/invalid-id/accept \
  -H "Authorization: Bearer TOKEN"
```

**Expected**: `400 Bad Request` or `404 Not Found`

---

### Test 5.2: Driver Not Online

**Steps**:
1. Set driver status to offline
2. Try to accept booking

**Expected**: `400 Bad Request` with message "Go online before accepting a booking"

---

### Test 5.3: Driver Not Verified

**Steps**:
1. Set driver status to 'pending'
2. Try to accept booking

**Expected**: `403 Forbidden` with message "Complete verification before accepting trips"

---

## Automated Test Suite

### Jest Test Example

```javascript
describe('Race Condition Protection', () => {
  let bookingId;
  let driverAToken;
  let driverBToken;

  beforeEach(async () => {
    // Create test booking
    bookingId = await createTestBooking();
    driverAToken = await getDriverToken('driverA');
    driverBToken = await getDriverToken('driverB');
  });

  test('should prevent double booking assignment', async () => {
    const [resultA, resultB] = await Promise.all([
      acceptBooking(bookingId, driverAToken),
      acceptBooking(bookingId, driverBToken)
    ]);

    const successful = [resultA, resultB].filter(r => r.status === 200);
    const conflicts = [resultA, resultB].filter(r => r.status === 409);

    expect(successful).toHaveLength(1);
    expect(conflicts).toHaveLength(1);
  });

  test('should maintain database consistency', async () => {
    await acceptBooking(bookingId, driverAToken);
    
    const booking = await Booking.findById(bookingId);
    expect(booking.status).toBe('en_route');
    expect(booking.provider.id).toBeDefined();
    expect(booking.__v).toBe(1);
  });

  test('should rollback on error', async () => {
    // Simulate error scenario
    jest.spyOn(Booking, 'save').mockRejectedValueOnce(new Error('Test error'));
    
    await expect(acceptBooking(bookingId, driverAToken)).rejects.toThrow();
    
    const booking = await Booking.findById(bookingId);
    expect(booking.status).toBe('pending');
    expect(booking.provider.id).toBeNull();
  });
});
```

---

## Monitoring & Alerts

### Metrics to Track

1. **Conflict Rate**:
   ```javascript
   // Count 409 responses
   const conflictRate = conflicts / totalRequests * 100;
   // Should be < 5% in normal operation
   ```

2. **Transaction Duration**:
   ```javascript
   // Log transaction time
   console.log(`Transaction completed in ${duration}ms`);
   // Should be < 100ms average
   ```

3. **Rollback Count**:
   ```javascript
   // Count transaction rollbacks
   // Should be minimal (< 1% of requests)
   ```

---

## Success Criteria

### All Tests Must Pass:
- ✅ Only one driver/captain can accept
- ✅ Conflicts return HTTP 409
- ✅ Database remains consistent
- ✅ Transactions rollback on error
- ✅ Version field increments
- ✅ Activity log updated
- ✅ Wallet operations atomic
- ✅ Performance acceptable (< 100ms avg)

### Production Ready When:
- ✅ All automated tests pass
- ✅ Load test successful
- ✅ No race conditions detected
- ✅ Error handling works
- ✅ Monitoring in place

---

## Troubleshooting

### Issue: Transactions Failing

**Cause**: MongoDB not running as replica set

**Solution**:
```bash
# Start MongoDB as replica set
mongod --replSet rs0

# Initialize replica set
mongo
> rs.initiate()
```

---

### Issue: High Conflict Rate

**Cause**: Too many drivers trying same booking

**Solution**: This is expected behavior - system is working correctly!

---

### Issue: Slow Performance

**Cause**: Transaction overhead

**Solution**: 
- Check MongoDB indexes
- Optimize queries
- Consider connection pooling

---

## Conclusion

Follow this testing guide to verify the race condition fix is working correctly. All tests should pass before deploying to production.

**Remember**: Race conditions are eliminated, but conflicts (409 responses) are expected and correct behavior when multiple drivers try to accept the same booking simultaneously.
