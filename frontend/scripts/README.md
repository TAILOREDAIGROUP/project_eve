# Test Scripts

This directory contains specialized testing utilities for Project EVE.

## Available Tests

### Stress Test
```bash
npm run test:stress
```
Tests system behavior under high load conditions.
- Simulates multiple concurrent users
- Measures response times under load
- Identifies performance bottlenecks

### Security Test
```bash
npm run test:security
```
Validates security controls and tenant isolation.
- Tests RLS policy enforcement
- Verifies authentication requirements
- Checks for data leakage between tenants

### Death Test
```bash
npm run test:death
```
Tests system recovery from failure conditions.
- Simulates API failures
- Tests graceful degradation
- Validates error handling

### Failure Test
```bash
npm run test:failure
```
Tests edge cases and failure modes.
- Invalid input handling
- Timeout scenarios
- Network failure simulation

### Running All Tests
```bash
npm run test:all-custom
```

## Prerequisites

- Ensure environment variables are set
- Database must be accessible
- Some tests may require test data setup
