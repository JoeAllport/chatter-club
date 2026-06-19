// CoursesHome.jsx — Courses home (/courses)
// Wrapper around the existing CourseList with a proper header and category filter
// Spec: docs/site-architecture.md — Courses section

import { useSearchParams } from 'react-router-dom'
import CourseList from '../CourseList'
import PageMeta from '../../components/PageMeta'

export default function CoursesHome() {
  const [searchParams] = useSearchParams()
  const cat = searchParams.get('cat') // exam-prep | life-english | null (all)

  return (
    <>
      <PageMeta
        title="Courses — English Learning"
        description="Self-paced English courses for every goal. Cambridge B2 First exam preparation, Life English, and more. Free to start."
        canonical="/courses"
      />

      {/* Header */}
      <div className="bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 mb-2">Courses</h1>
          <p className="text-gray-500 max-w-xl leading-relaxed">
            Self-paced courses you can work through at your own speed.
            Progress is saved automatically — pick up where you left off on any device.
          </p>
        </div>
      </div>

      {/* Course list — the existing component handles all the data */}
      <CourseList filterCategory={cat} minimal />
    </>
  )
}
