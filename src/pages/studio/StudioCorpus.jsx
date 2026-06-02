import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// TIER: admin (Joe only)

// ── Constants ─────────────────────────────────────────────────────────────────

const CEFR_LEVELS  = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const CEFR_BANDS   = [
  { value: 'A2_B1', label: 'Easy (A2–B1)' },
  { value: 'B1_B2', label: 'Medium (B1+–B2)' },
  { value: 'C1_C2', label: 'Hard (C1–C2)' },
]
const POS_OPTIONS  = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'phrase', 'other']
const SOURCES      = ['ngsl', 'cambridge_evp', 'manual', 'ai_season']

const STATUS_COLOURS = {
  approved: 'bg-green-900/40 text-green-300 border border-green-800',
  pending:  'bg-yellow-900/40 text-yellow-300 border border-yellow-800',
  rejected: 'bg-red-900/40 text-red-400 border border-red-800',
}

const LEVEL_COLOURS = {
  A1: 'bg-emerald-900/50 text-emerald-300',
  A2: 'bg-green-900/50 text-green-300',
  B1: 'bg-blue-900/50 text-blue-300',
  B2: 'bg-indigo-900/50 text-indigo-300',
  C1: 'bg-purple-900/50 text-purple-300',
  C2: 'bg-pink-900/50 text-pink-300',
}

const PAGE_SIZE = 50

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

// ── Word edit modal ───────────────────────────────────────────────────────────

function WordModal({ word, onSave, onClose }) {
  const isNew = !word.id
  const [form, setForm] = useState({
    word:           word.word           || '',
    lemma:          word.lemma          || '',
    part_of_speech: word.part_of_speech || 'noun',
    definition:     word.definition     || '',
    ipa:            word.ipa            || '',
    example:        word.example        || '',
    cefr_level:     word.cefr_level     || 'B1',
    frequency_rank: word.frequency_rank || '',
    topic_tags:     (word.topic_tags || []).join(', '),
    source:         word.source         || 'manual',
    status:         word.status         || 'approved',
    notes:          word.notes          || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSave() {
    if (!form.word.trim() || !form.definition.trim() || !form.cefr_level) {
      setError('Word, definition and CEFR level are required.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      word:           form.word.trim().toLowerCase(),
      lemma:          (form.lemma.trim() || form.word.trim()).toLowerCase(),
      part_of_speech: form.part_of_speech,
      definition:     form.definition.trim(),
      ipa:            form.ipa.trim() || null,
      example:        form.example.trim() || null,
      cefr_level:     form.cefr_level,
      frequency_rank: form.frequency_rank ? parseInt(form.frequency_rank) : null,
      topic_tags:     form.topic_tags
                        ? form.topic_tags.split(',').map(t => t.trim()).filter(Boolean)
                        : null,
      source:         form.source,
      status:         form.status,
      notes:          form.notes.trim() || null,
    }

    let result
    if (isNew) {
      result = await supabase.from('vocabulary_corpus').insert([payload]).select().single()
    } else {
      result = await supabase.from('vocabulary_corpus').update(payload).eq('id', word.id).select().single()
    }

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }

    onSave(result.data)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold">{isNew ? 'Add word' : `Edit: ${word.word}`}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-3">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Word *</span>
              <input value={form.word} onChange={set('word')}
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </label>
            <label>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Lemma (base form)</span>
              <input value={form.lemma} onChange={set('lemma')} placeholder="e.g. run for 'running'"
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </label>
            <label>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Part of speech</span>
              <select value={form.part_of_speech} onChange={set('part_of_speech')}
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {POS_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </label>
          </div>

          <label>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Definition *</span>
            <textarea value={form.definition} onChange={set('definition')} rows={2}
              className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="text-xs text-gray-400 uppercase tracking-wider">IPA</span>
              <input value={form.ipa} onChange={set('ipa')} placeholder="/ˈwɜːd/"
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </label>
            <label>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Frequency rank</span>
              <input value={form.frequency_rank} onChange={set('frequency_rank')} type="number" placeholder="e.g. 1500"
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </label>
          </div>

          <label>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Example sentence</span>
            <textarea value={form.example} onChange={set('example')} rows={2}
              className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label>
              <span className="text-xs text-gray-400 uppercase tracking-wider">CEFR level *</span>
              <select value={form.cefr_level} onChange={set('cefr_level')}
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {CEFR_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Source</span>
              <select value={form.source} onChange={set('source')}
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Status</span>
              <select value={form.status} onChange={set('status')}
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>

          <label>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Topic tags (comma-separated)</span>
            <input value={form.topic_tags} onChange={set('topic_tags')} placeholder="e.g. environment, science, travel"
              className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
          </label>

          <label>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Reviewer notes</span>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </label>
        </div>

        <div className="p-5 border-t border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg font-medium">
            {saving ? 'Saving…' : isNew ? 'Add word' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bulk approve banner ───────────────────────────────────────────────────────

function PendingBanner({ count, onApproveAll, onReviewAll }) {
  if (count === 0) return null
  return (
    <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-yellow-400 text-lg">⚠️</span>
        <div>
          <p className="text-yellow-200 font-medium text-sm">{count} word{count !== 1 ? 's' : ''} pending review</p>
          <p className="text-yellow-400/70 text-xs mt-0.5">Proposed by AI during season generation. Review before they appear in future seasons.</p>
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        <button onClick={onReviewAll}
          className="px-3 py-1.5 text-xs text-yellow-300 border border-yellow-700 hover:border-yellow-500 rounded-lg">
          View pending
        </button>
        <button onClick={onApproveAll}
          className="px-3 py-1.5 text-xs bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium">
          Approve all
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudioCorpus() {
  const [words,       setWords]       = useState([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [pendingCount,setPendingCount]= useState(0)

  // Filters
  const [search,      setSearch]      = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterStatus,setFilterStatus]= useState('')
  const [filterPos,   setFilterPos]   = useState('')
  const [filterSource,setFilterSource]= useState('')
  const [page,        setPage]        = useState(0)

  // Modal
  const [editWord,    setEditWord]    = useState(null)   // null | {} (new) | word obj

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('vocabulary_corpus')
      .select('*', { count: 'exact' })
      .order('frequency_rank', { ascending: true, nullsFirst: false })
      .order('word', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (search.trim()) {
      query = query.ilike('word', `%${search.trim()}%`)
    }
    if (filterLevel)  query = query.eq('cefr_level', filterLevel)
    if (filterStatus) query = query.eq('status', filterStatus)
    if (filterPos)    query = query.eq('part_of_speech', filterPos)
    if (filterSource) query = query.eq('source', filterSource)

    const { data, error, count } = await query

    if (!error) {
      setWords(data || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }, [search, filterLevel, filterStatus, filterPos, filterSource, page])

  useEffect(() => { load() }, [load])

  // Count pending words
  useEffect(() => {
    supabase
      .from('vocabulary_corpus')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingCount(count || 0))
  }, [words])

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [search, filterLevel, filterStatus, filterPos, filterSource])

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleApproveAll() {
    if (!confirm(`Approve all ${pendingCount} pending words?`)) return
    await supabase
      .from('vocabulary_corpus')
      .update({ status: 'approved' })
      .eq('status', 'pending')
    load()
  }

  function handleReviewAll() {
    setFilterStatus('pending')
    setPage(0)
  }

  async function handleStatusToggle(word) {
    const next = word.status === 'approved' ? 'rejected'
               : word.status === 'rejected' ? 'approved'
               : 'approved'
    await supabase.from('vocabulary_corpus').update({ status: next }).eq('id', word.id)
    setWords(ws => ws.map(w => w.id === word.id ? { ...w, status: next } : w))
  }

  function handleSaveWord(saved) {
    setEditWord(null)
    setWords(ws => {
      const exists = ws.find(w => w.id === saved.id)
      return exists
        ? ws.map(w => w.id === saved.id ? saved : w)
        : [saved, ...ws]
    })
    setTotal(t => t + (words.find(w => w.id === saved.id) ? 0 : 1))
  }

  // ── Stats bar ────────────────────────────────────────────────────────────────

  const levelCounts = CEFR_LEVELS.reduce((acc, l) => ({
    ...acc,
    [l]: words.filter(w => w.cefr_level === l).length,
  }), {})

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vocabulary corpus</h1>
          <p className="text-gray-400 text-sm mt-1">
            Master word list for daily challenge seasons · {total.toLocaleString()} words
          </p>
        </div>
        <button onClick={() => setEditWord({})}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">
          <span className="text-lg leading-none">+</span> Add word
        </button>
      </div>

      {/* Pending banner */}
      <div className="mb-4">
        <PendingBanner count={pendingCount} onApproveAll={handleApproveAll} onReviewAll={handleReviewAll} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-6 gap-2 mb-6">
        {CEFR_LEVELS.map(level => (
          <button key={level}
            onClick={() => setFilterLevel(filterLevel === level ? '' : level)}
            className={`rounded-xl p-3 text-center border transition-all ${
              filterLevel === level
                ? 'border-white/30 bg-white/10'
                : 'border-gray-700/50 bg-gray-800/40 hover:border-gray-600'
            }`}>
            <Badge className={LEVEL_COLOURS[level]}>{level}</Badge>
            <p className="text-white font-semibold text-lg mt-1">
              {words.filter(w => w.cefr_level === level).length}
            </p>
            <p className="text-gray-500 text-xs">shown</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search words…"
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-48"
        />
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
          <option value="">All levels</option>
          {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
          <option value="">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={filterPos} onChange={e => setFilterPos(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
          <option value="">All parts of speech</option>
          {POS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
          <option value="">All sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || filterLevel || filterStatus || filterPos || filterSource) && (
          <button onClick={() => { setSearch(''); setFilterLevel(''); setFilterStatus(''); setFilterPos(''); setFilterSource('') }}
            className="px-3 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg">
            Clear filters
          </button>
        )}
      </div>

      {/* Word table */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Loading…</div>
      ) : words.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-lg font-medium text-gray-400">No words found</p>
          <p className="text-sm mt-1">
            {total === 0
              ? 'Run migration 041 and seed 042 to populate the corpus.'
              : 'Try adjusting your filters.'}
          </p>
          {total === 0 && (
            <div className="mt-4 bg-gray-800 border border-gray-700 rounded-xl p-4 text-left text-xs text-gray-400 max-w-md mx-auto">
              <p className="font-mono mb-1 text-gray-300">Run in Supabase SQL editor:</p>
              <p className="font-mono text-green-400">1. supabase/migrations/041_vocabulary_corpus.sql</p>
              <p className="font-mono text-green-400">2. supabase/seeds/042_seed_vocabulary_corpus.sql</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Word</th>
                  <th className="text-left px-4 py-3 font-medium">Definition</th>
                  <th className="text-left px-3 py-3 font-medium">Level</th>
                  <th className="text-left px-3 py-3 font-medium">POS</th>
                  <th className="text-left px-3 py-3 font-medium">Source</th>
                  <th className="text-left px-3 py-3 font-medium">Tags</th>
                  <th className="text-left px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {words.map(word => (
                  <tr key={word.id} className="hover:bg-gray-800/40 group">
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-white font-medium">{word.word}</span>
                        {word.ipa && (
                          <span className="ml-2 text-gray-500 text-xs font-normal">{word.ipa}</span>
                        )}
                        {word.frequency_rank && (
                          <span className="ml-1.5 text-gray-600 text-xs">#{word.frequency_rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-xs">
                      <p className="truncate">{word.definition}</p>
                      {word.example && (
                        <p className="text-gray-500 text-xs mt-0.5 truncate italic">"{word.example}"</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Badge className={LEVEL_COLOURS[word.cefr_level] || ''}>{word.cefr_level}</Badge>
                    </td>
                    <td className="px-3 py-3 text-gray-400 text-xs">{word.part_of_speech}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{word.source}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {(word.topic_tags || []).slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{tag}</span>
                        ))}
                        {(word.topic_tags || []).length > 3 && (
                          <span className="text-xs text-gray-500">+{word.topic_tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => handleStatusToggle(word)}
                        title="Click to toggle status"
                        className="cursor-pointer">
                        <Badge className={STATUS_COLOURS[word.status] || ''}>{word.status}</Badge>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => setEditWord(word)}
                        className="text-xs text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 hover:bg-gray-700 rounded">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-gray-500 text-sm">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()} words
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm text-gray-300 border border-gray-700 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg">
                ← Previous
              </button>
              <button
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm text-gray-300 border border-gray-700 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg">
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit/add modal */}
      {editWord !== null && (
        <WordModal
          word={editWord}
          onSave={handleSaveWord}
          onClose={() => setEditWord(null)}
        />
      )}
    </div>
  )
}
