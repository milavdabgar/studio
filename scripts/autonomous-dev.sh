#!/bin/bash

# Autonomous Development Helper Script
# Usage: ./scripts/autonomous-dev.sh [issue-number]

set -e

ISSUE_NUMBER=${1:-""}
REPO_ROOT=$(git rev-parse --show-toplevel)

echo "🤖 Autonomous Development System"
echo "================================="

if [ -z "$ISSUE_NUMBER" ]; then
    echo "❓ Usage: $0 <issue-number>"
    echo ""
    echo "Available issues:"
    gh issue list --limit 5 --json number,title,state | jq -r '.[] | "  #\(.number): \(.title) (\(.state))"'
    exit 1
fi

echo "🎯 Processing Issue #$ISSUE_NUMBER"

# Check if issue exists
if ! gh issue view "$ISSUE_NUMBER" >/dev/null 2>&1; then
    echo "❌ Issue #$ISSUE_NUMBER not found"
    exit 1
fi

# Get issue details
ISSUE_TITLE=$(gh issue view "$ISSUE_NUMBER" --json title -q '.title')
ISSUE_BODY=$(gh issue view "$ISSUE_NUMBER" --json body -q '.body')

echo "📋 Issue: $ISSUE_TITLE"

# Create autonomous branch
BRANCH_NAME="autonomous/issue-$ISSUE_NUMBER"
echo "🌿 Creating branch: $BRANCH_NAME"

# Check if branch already exists
if git rev-parse --verify "$BRANCH_NAME" >/dev/null 2>&1; then
    echo "⚠️  Branch already exists. Switching to it..."
    git checkout "$BRANCH_NAME"
else
    git checkout -b "$BRANCH_NAME"
fi

# Create autonomous task directory
mkdir -p .autonomous/tasks/"$ISSUE_NUMBER"

# Generate Claude Code script
echo "📝 Generating Claude Code script..."
cat > .autonomous/tasks/"$ISSUE_NUMBER"/claude-script.md << EOF
# Autonomous Development Task #$ISSUE_NUMBER

## Issue Details
**Title**: $ISSUE_TITLE

**Description**:
$ISSUE_BODY

## Task Instructions

Please analyze this GitHub issue and implement a complete solution. Follow these steps:

### 1. 🔍 Analysis Phase
- Understand the problem described in the issue
- Identify the root cause
- Determine which files need to be modified
- Plan the implementation approach

### 2. 🛠️ Implementation Phase
- Make the necessary code changes
- Follow existing code patterns and conventions
- Ensure the solution is robust and handles edge cases
- Add appropriate error handling

### 3. 🧪 Testing Phase
- Create comprehensive tests for the new functionality
- Ensure all existing tests still pass
- Add edge case testing
- Test the solution manually if applicable

### 4. 📚 Documentation Phase
- Update any relevant documentation
- Add code comments where necessary
- Update README or other docs if the change affects user experience

### 5. 🔄 Quality Assurance
- Run linting and type checking
- Ensure code follows project standards
- Verify no breaking changes are introduced
- Optimize performance if applicable

## Project Context
- **Repository**: $(basename "$REPO_ROOT")
- **Issue Number**: #$ISSUE_NUMBER
- **Branch**: $BRANCH_NAME
- **Technology Stack**: Next.js, TypeScript, React, MongoDB, Puppeteer

## Expected Deliverables
1. ✅ Working implementation that solves the issue
2. ✅ Comprehensive tests covering the changes
3. ✅ Updated documentation (if needed)
4. ✅ Clean, well-commented code
5. ✅ Commit with clear description of changes

## Files to Consider
Based on the issue description, you should examine and potentially modify:
$(echo "$ISSUE_BODY" | grep -o '[a-zA-Z0-9_-]*\.[a-zA-Z0-9]*' | head -5 | sed 's/^/- /' || echo "- (Identify relevant files based on issue content)")

## Success Criteria
- [ ] Issue requirements are fully implemented
- [ ] All tests pass (npm test)
- [ ] Code passes linting (npm run lint)
- [ ] TypeScript compilation succeeds (npm run typecheck)
- [ ] No breaking changes introduced
- [ ] Solution is production-ready

---
**Ready for autonomous development!** 🚀

Please implement this solution autonomously, following the steps above.
EOF

# Create commit template
echo "📝 Creating commit template..."
cat > .autonomous/tasks/"$ISSUE_NUMBER"/commit-template.txt << EOF
🤖 Fix issue #$ISSUE_NUMBER: $ISSUE_TITLE

Autonomous implementation of GitHub issue #$ISSUE_NUMBER.

## Changes Made
- [List the key changes here]

## Files Modified
- [List modified files]

## Testing
- [Describe testing performed]

## Verification
- ✅ All tests pass
- ✅ TypeScript compilation succeeds
- ✅ Linting passes
- ✅ Manual testing completed

Closes #$ISSUE_NUMBER

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF

echo ""
echo "✅ Autonomous development setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Run: claude code .autonomous/tasks/$ISSUE_NUMBER/claude-script.md"
echo "2. Let Claude implement the solution autonomously"
echo "3. Review the changes"
echo "4. Commit using: .autonomous/tasks/$ISSUE_NUMBER/commit-template.txt"
echo "5. Push and create PR"
echo ""
echo "📁 Task files created in: .autonomous/tasks/$ISSUE_NUMBER/"
echo ""
EOF