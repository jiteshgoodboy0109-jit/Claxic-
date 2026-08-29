import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  X,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { CourseCard } from '../components/courses/CourseCard.jsx';

export const CoursesView = ({
  courses,
  onSelectCourse,
  onApplyCourse,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => c.category));
    return ['All', ...Array.from(set)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses
      .filter((c) => c.status === 'PUBLISHED' || c.status === 'FULL')
      .filter((c) => {
        const matchesSearch =
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.instructor && c.instructor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesCategory =
          selectedCategory === 'All' || c.category.toLowerCase() === selectedCategory.toLowerCase();

        const matchesLevel =
          selectedLevel === 'All' || c.level.toLowerCase() === selectedLevel.toLowerCase();

        const matchesMode =
          selectedMode === 'All' || c.mode.toLowerCase() === selectedMode.toLowerCase();

        return matchesSearch && matchesCategory && matchesLevel && matchesMode;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'popularity') return b.enrolledCount - a.enrolledCount;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [courses, searchTerm, selectedCategory, selectedLevel, selectedMode, sortBy]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSelectedMode('All');
    setSortBy('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 font-sans text-slate-900 bg-[#f6fafa] min-h-screen">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#eef7f7] border border-[#cbe4e4] text-xs font-semibold text-[#0B4F50]">
          <BookOpen className="w-3.5 h-3.5 text-[#0B4F50]" />
          <span>Academic Catalog Registry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          Explore Academic Specializations
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-normal max-w-2xl leading-relaxed">
          Industry-accredited masterclasses and executive engineering programs. Filter by specialization, difficulty level, or cohort delivery mode.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#d8ecec] shadow-xs space-y-6">
        {/* Top Row: Search + Sort */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by course title, skills (e.g. React, Kubernetes, AI), or faculty..."
              className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] rounded-full pl-11 pr-10 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 placeholder:text-slate-400 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-500 shrink-0">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] rounded-full px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 font-medium w-full md:w-auto cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="price_asc">Fee: Low to High</option>
              <option value="price_desc">Fee: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popularity">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="pt-4 border-t border-[#f2f7f7] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Specialization Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] rounded-full px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 cursor-pointer font-medium"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Difficulty Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] rounded-full px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 cursor-pointer font-medium"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Delivery Mode</label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full bg-[#f2f7f7] hover:bg-[#ebf4f4] focus:bg-white border border-[#d8ecec] rounded-full px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#0B4F50] focus:ring-2 focus:ring-[#0B4F50]/15 cursor-pointer font-medium"
            >
              <option value="All">All Modes</option>
              <option value="Live Interactive">Live Interactive</option>
              <option value="Bootcamp">Bootcamp</option>
              <option value="Hybrid Workshop">Hybrid Workshop</option>
              <option value="Self-Paced">Self-Paced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Showing {filteredCourses.length} accredited courses</span>
          {(searchTerm || selectedCategory !== 'All' || selectedLevel !== 'All' || selectedMode !== 'All') && (
            <button
              onClick={resetFilters}
              className="text-[#0B4F50] underline hover:text-[#073637] font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="py-20 text-center bg-white border border-[#d8ecec] rounded-[32px] space-y-4 shadow-xs">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No Matching Courses Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keywords or clearing filter selections.
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 bg-[#0B4F50] text-white rounded-full font-bold text-xs shadow-xs hover:bg-[#073637] cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                onSelect={onSelectCourse}
                onApply={onApplyCourse}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
