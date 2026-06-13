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
        const { passage, answers } = block.content
        const parts = (passage || '').split(/\(\d+\)\s*___+/)

        // Show full passage first as a read-only screen
        queue.push({
          id: `${block.id}-passage`,
          type: 'passage',
          blockId: block.id,
          isScored: false,
          data: {
            passage,
            gapStyle: 'numbered',
            totalGaps: answers?.length || 0,
            title: 'Open Cloze',
            instruction: 'Read the whole text carefully. Then fill in each gap one at a time.',
          },
        })

        // One screen per gap
        answers?.forEach((answer, i) => {
          const before = parts[i] || ''
          const after = parts[i + 1] || ''
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
        const { passage, answers, bank, useBank } = block.content
        const hasBank = useBank || (bank && bank.length > 0)
        const parts = (passage || '').split('___')

        // Show full passage first — always for typed fills, always for word-bank too
        // (students need to see the whole text to choose from the bank intelligently)
        queue.push({
          id: `${block.id}-passage`,
          type: 'passage',
          blockId: block.id,
          isScored: false,
          data: {
            passage,
            gapStyle: 'blank',
            totalGaps: answers?.length || 0,
            title: hasBank ? 'Gap Fill' : 'Gap Fill',
            instruction: hasBank
              ? 'Read the text. Then fill each gap using the words in the box.'
              : 'Read the text carefully. Then fill in each gap.',
          },
        })

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
              useBank: hasBank,
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

      case 'vocabulary': {
        // Each vocab item becomes a word_flash screen
        const items = block.content?.items || block.content?.vocab_items || []
        items.forEach((item, i) => {
          queue.push({
            id: `${block.id}-flash-${i}`,
            type: 'word_flash',
            blockId: block.id,
            isScored: true,
            data: {
              word: item.word,
              pos: item.pos || item.part_of_speech || null,
              definition: item.definition,
              example: item.example || null,
              collocations: item.collocations || null,
              wordFamily: item.wordFamily || item.word_family || null,
              itemIndex: i,
              totalItems: items.length,
            },
          })
        })
        break
      }

      case 'speed_round': {
        // The whole block is one timed game screen
        queue.push({
          id: `${block.id}-speed`,
          type: 'speed_round',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

      case 'memory_pairs': {
        queue.push({
          id: `${block.id}-memory`,
          type: 'memory_pairs',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

      case 'prep_sprint': {
        queue.push({
          id: `${block.id}-prep`,
          type: 'prep_sprint',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

      case 'collocation_snap': {
        queue.push({
          id: `${block.id}-snap`,
          type: 'collocation_snap',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

      case 'word_family_builder': {
        queue.push({
          id: `${block.id}-wfb`,
          type: 'word_family',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

      case 'transform_analyser': {
        queue.push({
          id: `${block.id}-ta`,
          type: 'transform_analyser',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

      case 'pronoun_tracker': {
        queue.push({
          id: `${block.id}-pt`,
          type: 'pronoun_tracker',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

      case 'true_match': {
        queue.push({
          id: `${block.id}-tm`,
          type: 'true_match',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

      case 'distractor_spotter': {
        queue.push({
          id: `${block.id}-ds`,
          type: 'distractor_spotter',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

      case 'highlight_task': {
        queue.push({
          id: `${block.id}-hl`,
          type: 'highlight_task',
          blockId: block.id,
          isScored: false,
          data: { ...block.content, mode: 'highlight' },
        })
        break
      }

      case 'cohesion_detector': {
        queue.push({
          id: `${block.id}-cd`,
          type: 'cohesion_detector',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

      case 'sentence_sorter': {
        queue.push({
          id: `${block.id}-ss`,
          type: 'sentence_sorter',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

      case 'synonym_snap': {
        queue.push({
          id: `${block.id}-syn`,
          type: 'synonym_snap',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

      case 'reading_passage': {
        queue.push({
          id: `${block.id}-rp`,
          type: 'reading_passage',
          blockId: block.id,
          isScored: true,
          data: block.content,
        })
        break
      }

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
