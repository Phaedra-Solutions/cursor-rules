// Prompt functions for promptfoo. Each test runs once with the rule as system context and once without it.

const BASE = 'You are a coding agent working in an existing repository. Answer with the code and the brief notes a careful senior engineer would give.'

function messages (system, task) {
  return JSON.stringify([
    { role: 'system', content: system },
    { role: 'user', content: task },
  ])
}

module.exports.withRule = async function ({ vars }) {
  return messages(`${BASE}\n\nFollow these project rules:\n\n${vars.rule_text}`, vars.task)
}

module.exports.withoutRule = async function ({ vars }) {
  return messages(BASE, vars.task)
}
