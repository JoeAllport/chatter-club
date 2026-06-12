/**
 * buildQueue.js
 * -------------
 * Converts an array of chapter_blocks into an ordered array of session screens.
 *
 * Each screen has:
 *   { id, type, data, blockId, isScored }
 *
 * Screen types:
 *   'intro'        — text or instructions block, tap to continue
 *   'mcq'          — single A/B/C/D question
 *   'open_cloze'   — full passage with numbered gaps (one screen)
 *   'cloze_item'   — single gap from an open_cloze or gap_fill block
 *   'word_form'    — single word formation line
 *   'transform'    — single key word transformation item
 *   'match_pair'   — matching exercise (all pairs on one screen)
 *   'word_flash'   — vocabulary introduction: word + definition + example
 *   'writing'      — writing task (full page, breaks out of step flow)
 *
 * Mode: 'learn' (default) — intros first, then exercises
 */

export function buildQueue(blocks, mode = 'learn') {
  const queue = []

  for (const block of blocks) {
    switch (block.block_type) {

      case 'text':
      case 'instructions':
        // Skip teacher_only (already filtered at query), include the rest
        queue.push({
          id: `${block.id}-intro`,
          type: 'intro',
          blockId: block.id,
          isScored: false,
          data: {
            body: block.content.body || block.content.text || '',
            blockType: block.block_type,
          },
        })
        break

      case 'mcq':
        queue.push({
          id: `${block.id}-mcq`,
          type: 'mcq',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break

      case 'open_cloze': {
        // Split into individual gap screens for one-at-a-time feel
        const { passage, answers } = block.content
        const parts = (passage || '').split(/\(\d+\)\s*___+/)
        answers?.forEach((answer, i) => {
          // Extract the sentence context around this gap
          const before = parts[i] || ''
          const after = parts[i + 1] || ''
          // Take last sentence fragment before gap + first sentence fragment after
          const contextBefore = before.split(/[.!?]\s+/).pop() || before
          const contextAfter = after.split(/[.!?]\s+/)[0] || after
          queue.push({
            id: `${block.id}-cloze-${i}`,
            type: 'cloze_item',
            blockId: block.id,
            isScored: true,
            data: {
              gapIndex: i,
              totalGaps: answers.length,
              contextBefore: contextBefore.trim(),
              contextAfter: contextAfter.trim(),
              answer,
              passageIntro: i === 0 ? passage : null, // show full passage on first gap
            },
          })
        })
        break
      }

      case 'word_formation': {
        const { lines, passage_before } = block.content
        lines?.forEach((line, i) => {
          queue.push({
            id: `${block.id}-wf-${i}`,
            type: 'word_form',
            blockId: block.id,
            isScored: true,
            data: {
              lineIndex: i,
              totalLines: lines.length,
              text: line.text,
              root: line.root,
              answer: line.answer,
              passageBefore: i === 0 ? passage_before : null,
            },
          })
        })
        break
      }

      case 'transformation': {
        const { items } = block.content
        items?.forEach((item, i) => {
          queue.push({
            id: `${block.id}-tf-${i}`,
            type: 'transform',
            blockId: block.id,
            isScored: true,
            data: {
              itemIndex: i,
              totalItems: items.length,
              original: item.original,
              key: item.key,
              answer: item.answer,
              note: item.note,
            },
          })
        })
        break
      }

      case 'gap_fill': {
        // Gap fill becomes individual cloze items (same as open_cloze)
        const { passage, answers, bank } = block.content
        const parts = (passage || '').split('___')
        answers?.forEach((answer, i) => {
          const contextBefore = (parts[i] || '').split(/[.!?\n]\s+/).pop() || ''
          const contextAfter = (parts[i + 1] || '').split(/[.!?\n]/)[0] || ''
          queue.push({
            id: `${block.id}-gf-${i}`,
            type: 'cloze_item',
            blockId: block.id,
            isScored: true,
            data: {
              gapIndex: i,
              totalGaps: answers.length,
              contextBefore: contextBefore.trim(),
              contextAfter: contextAfter.trim(),
              answer,
              bank: bank || [],
              useBank: true,
              passageIntro: i === 0 ? passage : null,
            },
          })
        })
        break
      }

      case 'matching':
        queue.push({
          id: `${block.id}-match`,
          type: 'match_pair',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break

      case 'writing_task':
        queue.push({
          id: `${block.id}-writing`,
          type: 'writing',
          blockId: block.id,
          isScored: false,
          data: block.content,
        })
        break

      case 'answer_key':
        // Never shown to students
        break

      default:
        break
    }
  }

  return queue
}

/**
 * buildReviewQueue — for spaced recall sessions.
 * Takes an array of { block, wrongCount, lastSeen } and builds
 * a focused queue of exercise screens only (no intros).
 */
export function buildReviewQueue(items) {
  // Filter to exercise blocks only, sort by most struggled / least recently seen
  const exerciseBlocks = items
    .filter(({ block }) => block.is_scored)
    .sort((a, b) => {
      const scoreA = (a.wrongCount || 0) - (a.rightCount || 0)
      const scoreB = (b.wrongCount || 0) - (b.rightCount || 0)
      return scoreB - scoreA
    })
    .map(({ block }) => block)

  return buildQueue(exerciseBlocks, 'review')
}
