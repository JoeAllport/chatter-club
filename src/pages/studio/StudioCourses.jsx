// StudioCourses.jsx — Course management in Studio
// TIER: admin (Joe only)
// Route: /studio/courses
//
// Features:
// - List all courses with status chips
// - Create new course (modal)
// - Edit course metadata
// - Add/reorder units
// - Add/reorder chapters within units
// - Link content_sets to chapters
// - Publish / unpublish

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// ── Shared UI ─────────────────────────────────────────────────────────────────

function StatusChip({ status }) {
  const colours = {
    draft:      'bg-gray-700 text-gray-300',
    in_review:  'bg-amber-900/60 text-amber-300',
    published:  'bg-green-900/60 text-green-300',
    archived:   'bg-red-900/60 text-red-300',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colours[status] ?? colours.draft}`}>
      {status}
    </span>
  )
}

function TextInput({ label, value, onChange, placeholder, textarea }) {
  const cls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-gray-400">{label}</label>}
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-gray-400">{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  )
}

// ── Course form (create / edit) ───────────────────────────────────────────────

const BLANK_COURSE = { title: '', description: '', slug: '', level: 'B1', is_free: false, status: 'draft' }
const LEVEL_OPTIONS = ['A1','A2','B1','B2','C1','C2','Mixed'].map(l => ({ value: l, label: l }))
const STATUS_OPTIONS = ['draft','in_review','published','archived'].map(s => ({ value: s, label: s }))

function CourseForm({ initial = BLANK_COURSE, onSave, saving }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  // Auto-generate slug from title
  function onTitleChange(v) {
    set('title', v)
    if (!form.slug || form.slug === slugify(form.title)) {
      set('slug', slugify(v))
    }
  }

  return (
    <div className="space-y-4">
      <TextInput label="Title" value={form.title} onChange={onTitleChange} placeholder="e.g. B2 Speaking Confidence" />
      <TextInput label="Description" value={form.description} onChange={v => set('description', v)} placeholder="What will students achieve?" textarea />
      <TextInput label="Slug (URL)" value={form.slug} onChange={v => set('slug', slugify(v))} placeholder="b2-speaking-confidence" />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Level" value={form.level} onChange={v => set('level', v)} options={LEVEL_OPTIONS} />
        <Select label="Status" value={form.status} onChange={v => set('status', v)} options={STATUS_OPTIONS} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_free}
          onChange={e => set('is_free', e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-gray-300">Free course (no Pro required)</span>
      </label>
      <button
        onClick={() => onSave(form)}
        disabled={!form.title.trim() || saving}
        className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
      >
        {saving ? 'Saving…' : 'Save course'}
      </button>
    </div>
  )
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Unit + Chapter editor (inline, for selected course) ───────────────────────

function CourseStructureEditor({ course }) {
  const [units, setUnits]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [newUnitTitle, setNewUnitTitle]   = useState('')
  const [addingUnit, setAddingUnit]       = useState(false)
  const [expandedUnit, setExpandedUnit]   = useState(null)
  const [newChapTitle, setNewChapTitle]   = useState('')
  const [addingChap, setAddingChap]       = useState(null)  // unit_id

  useEffect(() => {
    loadStructure()
  }, [course.id])

  async function loadStructure() {
    setLoading(true)
    const { data: unitData } = await supabase
      .from('course_units')
      .select('id, title, position')
      .eq('course_id', course.id)
      .order('position')

    if (!unitData?.length) { setUnits([]); setLoading(false); return }

    const { data: chapData } = await supabase
      .from('course_chapters')
      .select('id, unit_id, title, description, position, is_free_preview, estimated_mins')
      .eq('course_id', course.id)
      .order('position')

    const unitMap = {}
    unitData.forEach(u => { unitMap[u.id] = { ...u, chapters: [] } })
    chapData?.forEach(ch => { unitMap[ch.unit_id]?.chapters.push(ch) })
    setUnits(unitData.map(u => unitMap[u.id]))
    setLoading(false)
  }

  async function addUnit() {
    if (!newUnitTitle.trim()) return
    setAddingUnit(true)
    const maxPos = Math.max(0, ...units.map(u => u.position)) + 1
    await supabase.from('course_units').insert({
      course_id: course.id,
      title:     newUnitTitle.trim(),
      position:  maxPos,
    })
    setNewUnitTitle('')
    await loadStructure()
    setAddingUnit(false)
  }

  async function deleteUnit(unitId) {
    if (!confirm('Delete this unit and all its chapters?')) return
    await supabase.from('course_units').delete().eq('id', unitId)
    await loadStructure()
  }

  async function addChapter(unitId) {
    if (!newChapTitle.trim()) return
    setAddingChap(unitId)
    const unit = units.find(u => u.id === unitId)
    const maxPos = Math.max(0, ...unit.chapters.map(c => c.position)) + 1
    await supabase.from('course_chapters').insert({
      unit_id:   unitId,
      course_id: course.id,
      title:     newChapTitle.trim(),
      position:  maxPos,
    })
    setNewChapTitle('')
    await loadStructure()
    setAddingChap(null)
  }

  async function deleteChapter(chapterId) {
    if (!confirm('Delete this chapter?')) return
    await supabase.from('course_chapters').delete().eq('id', chapterId)
    await loadStructure()
  }

  async function toggleFreePreview(chapter) {
    await supabase
      .from('course_chapters')
      .update({ is_free_preview: !chapter.is_free_preview })
      .eq('id', chapter.id)
    await loadStructure()
  }

  if (loading) return <p className="text-gray-500 text-sm">Loading structure…</p>

  return (
    <div className="space-y-3">
      {units.map((unit, ui) => (
        <div key={unit.id} className="bg-gray-800/50 rounded-xl border border-gray-700">
          {/* Unit header */}
          <button
            className="w-full flex items-center gap-2 px-4 py-3 text-left"
            onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
          >
            <span className="text-xs font-semibold text-gray-500">U{ui + 1}</span>
            <span className="flex-1 text-sm font-semibold text-white">{unit.title}</span>
            <span className="text-xs text-gray-500">{unit.chapters.length} ch</span>
            <span className="text-gray-500">{expandedUnit === unit.id ? '▲' : '▼'}</span>
          </button>

          {expandedUnit === unit.id && (
            <div className="border-t border-gray-700 px-4 py-3 space-y-2">
              {unit.chapters.map((ch, ci) => (
                <div key={ch.id} className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-gray-500 w-6 shrink-0">{ui + 1}.{ci + 1}</span>
                  <span className="flex-1 text-gray-200 truncate">{ch.title}</span>
                  {ch.is_free_preview && (
                    <span className="text-xs bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded">Free</span>
                  )}
                  <button
                    onClick={() => toggleFreePreview(ch)}
                    className="text-xs text-gray-500 hover:text-indigo-400 transition-colors px-1"
                    title="Toggle free preview"
                  >
                    👁
                  </button>
                  <button
                    onClick={() => deleteChapter(ch.id)}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add chapter */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={addingChap === unit.id ? newChapTitle : ''}
                  onChange={e => { setNewChapTitle(e.target.value) }}
                  onFocus={() => setAddingChap(unit.id)}
                  placeholder="+ Add chapter title"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                  onKeyDown={e => e.key === 'Enter' && addChapter(unit.id)}
                />
                <button
                  onClick={() => addChapter(unit.id)}
                  disabled={!newChapTitle.trim() || addingChap !== unit.id}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Delete unit */}
              <button
                onClick={() => deleteUnit(unit.id)}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors"
              >
                Delete unit
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add unit */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newUnitTitle}
          onChange={e => setNewUnitTitle(e.target.value)}
          placeholder="New unit title…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          onKeyDown={e => e.key === 'Enter' && addUnit()}
        />
        <button
          onClick={addUnit}
          disabled={!newUnitTitle.trim() || addingUnit}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {addingUnit ? '…' : 'Add unit'}
        </button>
      </div>
    </div>
  )
}

// ── Main StudioCourses ────────────────────────────────────────────────────────

export default function StudioCourses() {
  const [courses, setCourses]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editCourse, setEditCourse] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [saving, setSaving]       = useState(false)

  useEffect(() => { loadCourses() }, [])

  async function loadCourses() {
    setLoading(true)
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug, level, status, is_free, unit_count, updated_at')
      .order('updated_at', { ascending: false })
    setCourses(data ?? [])
    setLoading(false)
  }

  async function createCourse(form) {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title:       form.title,
        description: form.description || null,
        slug:        form.slug || null,
        level:       form.level,
        is_free:     form.is_free,
        status:      form.status,
        created_by:  user?.id,
      })
      .select()
      .single()

    setSaving(false)
    if (!error && data) {
      setShowCreate(false)
      await loadCourses()
      setSelectedCourse(data)
    } else {
      alert(error?.message ?? 'Error creating course')
    }
  }

  async function updateCourse(form) {
    if (!editCourse) return
    setSaving(true)
    const { error } = await supabase
      .from('courses')
      .update({
        title:       form.title,
        description: form.description || null,
        slug:        form.slug || null,
        level:       form.level,
        is_free:     form.is_free,
        status:      form.status,
      })
      .eq('id', editCourse.id)

    setSaving(false)
    if (!error) {
      setEditCourse(null)
      await loadCourses()
    } else {
      alert(error.message)
    }
  }

  async function deleteCourse(id) {
    if (!confirm('Delete this course and all its structure? This cannot be undone.')) return
    await supabase.from('courses').delete().eq('id', id)
    if (selectedCourse?.id === id) setSelectedCourse(null)
    await loadCourses()
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="text-sm text-gray-400 mt-0.5">Build and manage self-paced courses</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          + New course
        </button>
      </div>

      {/* Two-column: course list + structure editor */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

        {/* Course list */}
        <div className="space-y-2">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : courses.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-gray-500">No courses yet.</p>
              <button onClick={() => setShowCreate(true)} className="text-indigo-400 text-sm hover:underline">
                Create the first one →
              </button>
            </div>
          ) : (
            courses.map(course => (
              <div
                key={course.id}
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                  selectedCourse?.id === course.id
                    ? 'border-indigo-500 bg-indigo-900/20'
                    : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                }`}
                onClick={() => setSelectedCourse(course)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusChip status={course.status} />
                      {course.level && (
                        <span className="text-xs text-gray-500">{course.level}</span>
                      )}
                      {course.is_free && (
                        <span className="text-xs text-green-500">Free</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); setEditCourse(course) }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                      title="Edit metadata"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteCourse(course.id) }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
                      title="Delete course"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Structure editor */}
        <div>
          {selectedCourse ? (
            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white">{selectedCourse.title}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Units &amp; chapters</p>
                </div>
                <a
                  href={`/courses/${selectedCourse.slug || selectedCourse.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:underline"
                >
                  Preview ↗
                </a>
              </div>
              <CourseStructureEditor course={selectedCourse} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-800 flex items-center justify-center h-48">
              <p className="text-sm text-gray-600">Select a course to edit its structure</p>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="New course" onClose={() => setShowCreate(false)}>
          <CourseForm onSave={createCourse} saving={saving} />
        </Modal>
      )}

      {/* Edit modal */}
      {editCourse && (
        <Modal title="Edit course" onClose={() => setEditCourse(null)}>
          <CourseForm initial={editCourse} onSave={updateCourse} saving={saving} />
        </Modal>
      )}
    </div>
  )
}
