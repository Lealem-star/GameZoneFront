# NumberGuessingGame Testing Guide

This guide explains how to test the NumberGuessingGame component with its new elimination and round logic.

## 🚀 Quick Start

### Automated Testing
```bash
# Run all tests
npm test

# Run only game tests
npm run test:game

# Run game tests in watch mode
npm run test:game:watch

# Run game tests with coverage
npm run test:game:coverage

# Show manual testing guide
npm run test:manual
```

### Manual Testing
1. Start the development server: `npm start`
2. Navigate to a game page in your browser
3. Follow the test scenarios below

## 🧪 Test Scenarios

### 1. Round 1 - All Players Fail
**Expected**: Game Over screen with "players swallowed" message

**Steps**:
1. Start game with 4 players
2. All players guess "Higher"
3. Next number is lower than current
4. Should show elimination screen with "You failed!" messages
5. Should show Game Over screen

### 2. Round 1 - All Players Pass
**Expected**: Continue to Round 2 without elimination screen

**Steps**:
1. Start game with 4 players
2. All players guess "Higher"
3. Next number is higher than current
4. Should continue to Round 2
5. No elimination screen shown

### 3. Round 1 - Mixed Results
**Expected**: Show elimination screen, then continue to Round 2

**Steps**:
1. Start game with 4 players
2. Players 1 & 3 guess "Higher" (pass)
3. Players 2 & 4 guess "Lower" (fail)
4. Should show elimination screen for failed players
5. Should continue to Round 2 with 2 survivors

### 4. Round 2 - All Players Fail
**Expected**: Game Over screen with "players swallowed" message

**Steps**:
1. Complete Round 1 with survivors
2. All remaining players guess incorrectly
3. Should show elimination screen
4. Should show Game Over screen

### 5. Round 2 - All Players Pass
**Expected**: Go directly to DrawWinner page

**Steps**:
1. Complete Round 1 with survivors
2. All remaining players guess correctly
3. Should navigate to DrawWinner page
4. No elimination screen shown

### 6. Single Winner
**Expected**: Declare winner immediately and go to DrawWinner

**Steps**:
1. Start game with 4 players
2. Only one player guesses correctly
3. Should navigate to DrawWinner with skipDrawing flag
4. Winner should be declared immediately

## ✅ Testing Checklist

### Core Functionality
- [ ] Elimination screen shows failed players with "You failed!" message
- [ ] Eliminated participants list appears in main interface
- [ ] Game Over screen shows when all players fail in any round
- [ ] Round 2 starts correctly after Round 1 with survivors
- [ ] DrawWinner page loads correctly for winners
- [ ] Single winner is declared immediately
- [ ] All pass scenarios work correctly in both rounds
- [ ] Mixed results scenarios work correctly

### UI/UX
- [ ] Loading states display correctly
- [ ] Error handling works for API failures
- [ ] Audio controls work properly
- [ ] Responsive design works on mobile/desktop
- [ ] Animations and transitions are smooth
- [ ] Text is readable and properly formatted

### Edge Cases
- [ ] Game handles 1 participant
- [ ] Game handles many participants (10+)
- [ ] Game handles participants without photos
- [ ] Game handles network errors gracefully
- [ ] Game handles invalid game IDs
- [ ] Game handles missing participant data

## 🔧 Troubleshooting

### Common Issues

**Tests fail with import errors**
```bash
# Make sure all dependencies are installed
npm install

# Clear Jest cache
npm test -- --clearCache
```

**Tests timeout**
- Increase timeout in test file
- Check for infinite loops in component
- Verify async operations complete

**Component not rendering**
- Check console for errors
- Verify all required props are passed
- Check for missing dependencies

**API calls failing**
- Ensure backend is running
- Check API endpoints are correct
- Verify authentication tokens

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test
npm test -- --testNamePattern="All Players Fail"

# Run tests with coverage
npm test -- --coverage --watchAll=false

# Debug mode
npm test -- --detectOpenHandles --forceExit
```

## 📊 Test Coverage

The test suite covers:
- ✅ Game initialization
- ✅ Round progression logic
- ✅ Elimination scenarios
- ✅ Winner declaration
- ✅ Error handling
- ✅ UI state management
- ✅ Navigation flows
- ✅ API integration

## 🎯 Performance Testing

### Load Testing
- Test with 20+ participants
- Monitor memory usage
- Check for performance degradation

### Stress Testing
- Rapid button clicks
- Network interruption simulation
- Browser refresh during game

## 📝 Notes

- Tests use timeouts to account for animation delays
- Mock data is used to simulate different scenarios
- API calls are mocked to avoid backend dependencies
- Audio elements are mocked to prevent browser autoplay issues
- React Router navigation is mocked for testing

## 🚀 Continuous Integration

For CI/CD pipelines, add these commands:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: npm run test:game:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the test logs for specific errors
3. Verify the component implementation matches test expectations
4. Check for recent changes that might affect the logic

---

**Happy Testing! 🎮**
