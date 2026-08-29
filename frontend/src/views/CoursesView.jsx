import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  Clock,
  BookOpen,
  ArrowRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';

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
          c.instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 font-sans text-slate-900 bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono text-indigo-700 uppercase tracking-widest font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>Academic Catalog Registry</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-display uppercase tracking-tight">
          Explore Course Programs
        </h1>
        <p className="text-sm text-slate-600 font-normal max-w-2xl">
          Discover hands-on masterclasses and executive engineering programs. Filter by category, difficulty level, or delivery mode.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        {/* Top Row: Search + Sort */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by course title, skills (e.g. React, Kubernetes, AI), or faculty..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-mono text-slate-500 shrink-0 uppercase font-semibold">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-mono w-full md:w-auto"
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
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-mono text-slate-600 uppercase mb-1.5 font-semibold">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-slate-600 uppercase mb-1.5 font-semibold">Difficulty Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-slate-600 uppercase mb-1.5 font-semibold">Mode</label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
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
        <div className="flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Showing {filteredCourses.length} accredited courses</span>
          {(searchTerm || selectedCategory !== 'All' || selectedLevel !== 'All' || selectedMode !== 'All') && (
            <button
              onClick={resetFilters}
              className="text-indigo-600 underline hover:text-indigo-800 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="py-20 text-center bg-white border border-slate-200 rounded-3xl space-y-4 shadow-xs">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 uppercase font-display">No Matching Courses Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keywords or clearing price filters.
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((c) => (
              <div
                key={c.id}
                className="group bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={c.bannerImage}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <Badge variant="gold">{c.category}</Badge>
                      <Badge variant="default">{c.level}</Badge>
                    </div>
                    {c.status === 'FULL' && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="danger">FULL</Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        {c.duration}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {c.rating} ({c.reviewsCount})
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectCourse(c)}
                      className="text-lg font-bold text-slate-900 font-display leading-snug cursor-pointer hover:text-indigo-600 uppercase transition-colors"
                    >
                      {c.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {c.shortDescription}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.tags.map((t) => (
                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
                      Tuition Fee
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-700">
                      ₹{c.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectCourse(c)}
                    >
                      Details
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      isDisabled={c.status === 'FULL'}
                      onClick={() => onApplyCourse(c)}
                    >
                      {c.status === 'FULL' ? 'Full' : 'Register'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
