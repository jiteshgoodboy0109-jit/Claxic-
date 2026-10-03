import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Check, X, Sparkles, GraduationCap } from 'lucide-react';

export const INDIAN_DEGREES = [
  // 🎓 1. Arts & Humanities
  { category: 'Arts & Humanities', name: 'BA – Bachelor of Arts', tags: ['ba', 'arts', 'humanities', 'bachelor of arts'] },
  { category: 'Arts & Humanities', name: 'BA English', tags: ['ba english', 'english', 'literature', 'language'] },
  { category: 'Arts & Humanities', name: 'BA Tamil', tags: ['ba tamil', 'tamil', 'language', 'literature'] },
  { category: 'Arts & Humanities', name: 'BA History', tags: ['ba history', 'history', 'civilization', 'archaeology'] },
  { category: 'Arts & Humanities', name: 'BA Economics', tags: ['ba economics', 'economics', 'macro', 'micro'] },
  { category: 'Arts & Humanities', name: 'BA Sociology', tags: ['ba sociology', 'sociology', 'society'] },
  { category: 'Arts & Humanities', name: 'BA Psychology', tags: ['ba psychology', 'psychology', 'mental health', 'counseling'] },
  { category: 'Arts & Humanities', name: 'BA Political Science', tags: ['ba political science', 'politics', 'pol science', 'civics'] },
  { category: 'Arts & Humanities', name: 'BA Journalism & Mass Communication', tags: ['ba journalism', 'mass com', 'media', 'news'] },
  { category: 'Arts & Humanities', name: 'BA Philosophy', tags: ['ba philosophy', 'philosophy', 'ethics'] },
  { category: 'Arts & Humanities', name: 'BA Geography', tags: ['ba geography', 'geography', 'earth'] },
  { category: 'Arts & Humanities', name: 'BA Social Work', tags: ['ba social work', 'bsw', 'social service'] },
  { category: 'Arts & Humanities', name: 'BA Literature', tags: ['ba literature', 'literature', 'language'] },

  // 💻 2. Computer & IT
  { category: 'Computer & IT', name: 'BCA – Bachelor of Computer Applications', tags: ['bca', 'computer applications', 'coding', 'software', 'programming'] },
  { category: 'Computer & IT', name: 'B.Sc Computer Science', tags: ['bsc cs', 'bsc computer science', 'computer science', 'programming'] },
  { category: 'Computer & IT', name: 'B.Sc IT', tags: ['bsc it', 'it', 'information technology'] },
  { category: 'Computer & IT', name: 'B.Sc Data Science', tags: ['bsc data science', 'data science', 'analytics', 'big data'] },
  { category: 'Computer & IT', name: 'B.Sc Artificial Intelligence', tags: ['bsc ai', 'ai', 'artificial intelligence', 'machine learning'] },
  { category: 'Computer & IT', name: 'B.Sc Cyber Security', tags: ['bsc cyber security', 'cyber', 'security', 'ethical hacking'] },
  { category: 'Computer & IT', name: 'B.Sc Information Technology', tags: ['bsc information technology', 'bsc it', 'software'] },
  { category: 'Computer & IT', name: 'B.Tech Computer Science', tags: ['btech cs', 'btech cse', 'computer science', 'btech', 'software engineering'] },
  { category: 'Computer & IT', name: 'B.Tech IT', tags: ['btech it', 'information technology', 'btech'] },
  { category: 'Computer & IT', name: 'B.Tech AI & ML', tags: ['btech aiml', 'btech ai', 'btech ml', 'machine learning', 'artificial intelligence'] },
  { category: 'Computer & IT', name: 'B.Tech Data Science', tags: ['btech data science', 'data analytics', 'big data'] },
  { category: 'Computer & IT', name: 'B.Tech Cyber Security', tags: ['btech cyber security', 'cyber defense', 'infosec'] },
  { category: 'Computer & IT', name: 'B.Tech Software Engineering', tags: ['btech software engineering', 'software development', 'coding'] },
  { category: 'Computer & IT', name: 'MCA – Master of Computer Applications', tags: ['mca', 'postgraduate', 'masters', 'software'] },

  // 🔬 3. Science
  { category: 'Science', name: 'B.Sc Physics', tags: ['bsc physics', 'physics', 'quantum', 'mechanics'] },
  { category: 'Science', name: 'B.Sc Chemistry', tags: ['bsc chemistry', 'chemistry', 'organic', 'inorganic'] },
  { category: 'Science', name: 'B.Sc Mathematics', tags: ['bsc maths', 'mathematics', 'calculus', 'algebra'] },
  { category: 'Science', name: 'B.Sc Biology', tags: ['bsc biology', 'biology', 'life science'] },
  { category: 'Science', name: 'B.Sc Biotechnology', tags: ['bsc biotechnology', 'biotech', 'genetics', 'dna'] },
  { category: 'Science', name: 'B.Sc Microbiology', tags: ['bsc microbiology', 'microbiology', 'bacteria'] },
  { category: 'Science', name: 'B.Sc Biochemistry', tags: ['bsc biochemistry', 'biochem', 'molecules'] },
  { category: 'Science', name: 'B.Sc Zoology', tags: ['bsc zoology', 'zoology', 'animal science'] },
  { category: 'Science', name: 'B.Sc Botany', tags: ['bsc botany', 'botany', 'plant biology'] },
  { category: 'Science', name: 'B.Sc Environmental Science', tags: ['bsc environmental science', 'ecology', 'nature'] },
  { category: 'Science', name: 'B.Sc Statistics', tags: ['bsc statistics', 'stats', 'probability', 'data analysis'] },
  { category: 'Science', name: 'B.Sc Geology', tags: ['bsc geology', 'geology', 'earth sciences', 'minerals'] },
  { category: 'Science', name: 'M.Sc – Master of Science', tags: ['msc', 'masters in science', 'postgraduate'] },

  // ⚙️ 4. Engineering
  { category: 'Engineering', name: 'B.E Civil Engineering', tags: ['be civil', 'civil engineering', 'structures', 'construction'] },
  { category: 'Engineering', name: 'B.E Mechanical Engineering', tags: ['be mechanical', 'mech', 'thermal', 'machines'] },
  { category: 'Engineering', name: 'B.E Electrical & Electronics Engineering', tags: ['be eee', 'electrical', 'power', 'circuits'] },
  { category: 'Engineering', name: 'B.E Electronics & Communication Engineering', tags: ['be ece', 'electronics', 'telecom', 'vlsi'] },
  { category: 'Engineering', name: 'B.E Computer Science Engineering', tags: ['be cse', 'computer science', 'software', 'programming'] },
  { category: 'Engineering', name: 'B.E Automobile Engineering', tags: ['be automobile', 'automotive', 'vehicles', 'ev'] },
  { category: 'Engineering', name: 'B.E Aeronautical Engineering', tags: ['be aeronautical', 'aero', 'aviation', 'aircraft'] },
  { category: 'Engineering', name: 'B.E Biomedical Engineering', tags: ['be biomedical', 'medical instrumentation', 'biomed'] },
  { category: 'Engineering', name: 'B.E Chemical Engineering', tags: ['be chemical', 'process engineering', 'chemistry'] },
  { category: 'Engineering', name: 'B.E Robotics & Automation', tags: ['be robotics', 'robotics', 'automation', 'mechatronics'] },
  { category: 'Engineering', name: 'B.E Mechatronics Engineering', tags: ['be mechatronics', 'mechatronics', 'mechanical electronics'] },
  { category: 'Engineering', name: 'B.E Marine Engineering', tags: ['be marine', 'marine engineering', 'naval', 'shipping'] },
  { category: 'Engineering', name: 'B.E Industrial Engineering', tags: ['be industrial', 'industrial engineering', 'operations', 'manufacturing'] },
  { category: 'Engineering', name: 'M.Tech – Master of Technology', tags: ['mtech', 'masters in engineering', 'postgraduate'] },

  // 💼 5. Commerce & Management
  { category: 'Commerce & Management', name: 'B.Com', tags: ['bcom', 'commerce', 'finance', 'accounts'] },
  { category: 'Commerce & Management', name: 'B.Com CA', tags: ['bcom ca', 'chartered accountant', 'computer applications'] },
  { category: 'Commerce & Management', name: 'B.Com Computer Applications', tags: ['bcom computer applications', 'bcom it'] },
  { category: 'Commerce & Management', name: 'B.Com Banking & Finance', tags: ['bcom banking', 'banking and finance', 'investments'] },
  { category: 'Commerce & Management', name: 'B.Com Accounting & Finance', tags: ['bcom accounting', 'af', 'auditing'] },
  { category: 'Commerce & Management', name: 'B.Com Corporate Secretaryship', tags: ['bcom cs', 'corporate secretaryship', 'corporate law'] },
  { category: 'Commerce & Management', name: 'BBA', tags: ['bba', 'business administration', 'management'] },
  { category: 'Commerce & Management', name: 'BBA Finance', tags: ['bba finance', 'corporate finance', 'investments'] },
  { category: 'Commerce & Management', name: 'BBA Marketing', tags: ['bba marketing', 'sales', 'branding', 'market research'] },
  { category: 'Commerce & Management', name: 'BBA HR', tags: ['bba hr', 'human resource management', 'personnel'] },
  { category: 'Commerce & Management', name: 'BBA International Business', tags: ['bba ib', 'international trade', 'global business'] },
  { category: 'Commerce & Management', name: 'BMS – Bachelor of Management Studies', tags: ['bms', 'management studies', 'business leadership'] },
  { category: 'Commerce & Management', name: 'MBA – Master of Business Administration', tags: ['mba', 'postgraduate', 'masters', 'business administration'] },
  { category: 'Commerce & Management', name: 'M.Com – Master of Commerce', tags: ['mcom', 'postgraduate', 'commerce'] },

  // ⚕️ 6. Medical & Healthcare
  { category: 'Medical & Healthcare', name: 'MBBS', tags: ['mbbs', 'doctor', 'medicine', 'surgery', 'physician'] },
  { category: 'Medical & Healthcare', name: 'BDS – Dental Surgery', tags: ['bds', 'dental', 'dentist', 'oral surgery'] },
  { category: 'Medical & Healthcare', name: 'BAMS – Ayurveda', tags: ['bams', 'ayurveda', 'ayurvedic medicine'] },
  { category: 'Medical & Healthcare', name: 'BHMS – Homeopathy', tags: ['bhms', 'homeopathy', 'homeopathic medicine'] },
  { category: 'Medical & Healthcare', name: 'BSMS – Siddha', tags: ['bsms', 'siddha', 'siddha medicine'] },
  { category: 'Medical & Healthcare', name: 'BUMS – Unani', tags: ['bums', 'unani', 'unani medicine'] },
  { category: 'Medical & Healthcare', name: 'BNYS – Naturopathy & Yogic Sciences', tags: ['bnys', 'naturopathy', 'yoga science'] },
  { category: 'Medical & Healthcare', name: 'B.Sc Nursing', tags: ['bsc nursing', 'nursing', 'nurse', 'clinical care'] },
  { category: 'Medical & Healthcare', name: 'BPT – Physiotherapy', tags: ['bpt', 'physiotherapy', 'physio', 'rehabilitation'] },
  { category: 'Medical & Healthcare', name: 'BOT – Occupational Therapy', tags: ['bot', 'occupational therapy', 'therapy'] },
  { category: 'Medical & Healthcare', name: 'B.Pharm – Pharmacy', tags: ['bpharm', 'pharmacy', 'medicines', 'pharmacology'] },
  { category: 'Medical & Healthcare', name: 'Pharm.D', tags: ['pharmd', 'doctor of pharmacy', 'clinical pharmacy'] },
  { category: 'Medical & Healthcare', name: 'BASLP – Audiology & Speech-Language Pathology', tags: ['baslp', 'audiology', 'speech therapy', 'pathology'] },
  { category: 'Medical & Healthcare', name: 'B.Sc Medical Laboratory Technology', tags: ['bsc mlt', 'medical lab', 'mlt', 'diagnostics'] },
  { category: 'Medical & Healthcare', name: 'B.Sc Radiology', tags: ['bsc radiology', 'xray', 'imaging', 'mri'] },
  { category: 'Medical & Healthcare', name: 'B.Sc Optometry', tags: ['bsc optometry', 'eye care', 'optometry', 'vision'] },

  // ⚖️ 7. Law
  { category: 'Law', name: 'LLB', tags: ['llb', 'law', 'advocate', 'lawyer', 'legal'] },
  { category: 'Law', name: 'BA LLB', tags: ['ba llb', 'ballb', 'integrated law', 'humanities law'] },
  { category: 'Law', name: 'BBA LLB', tags: ['bba llb', 'bballb', 'corporate law', 'business law'] },
  { category: 'Law', name: 'B.Com LLB', tags: ['bcom llb', 'bcomllb', 'commercial law', 'tax law'] },
  { category: 'Law', name: 'B.Sc LLB', tags: ['bsc llb', 'bscllb', 'science law', 'patent law'] },
  { category: 'Law', name: 'LLM – Master of Laws', tags: ['llm', 'masters in law', 'postgraduate'] },

  // 🏗️ 8. Architecture & Design
  { category: 'Architecture & Design', name: 'B.Arch – Architecture', tags: ['barch', 'architecture', 'building design', 'architect'] },
  { category: 'Architecture & Design', name: 'B.Des – Design', tags: ['bdes', 'design', 'ui ux', 'industrial design'] },
  { category: 'Architecture & Design', name: 'B.Plan – Planning', tags: ['bplan', 'urban planning', 'town planning'] },
  { category: 'Architecture & Design', name: 'BFA – Fine Arts', tags: ['bfa', 'fine arts', 'painting', 'visual arts'] },
  { category: 'Architecture & Design', name: 'B.Fashion Design', tags: ['b fashion design', 'fashion', 'apparel', 'textiles'] },
  { category: 'Architecture & Design', name: 'B.Des Fashion', tags: ['bdes fashion', 'fashion styling', 'garment'] },
  { category: 'Architecture & Design', name: 'B.Des Interior Design', tags: ['bdes interior', 'interior design', 'space planning'] },
  { category: 'Architecture & Design', name: 'B.Des Product Design', tags: ['bdes product', 'product design', 'ergonomics'] },
  { category: 'Architecture & Design', name: 'B.Des Communication Design', tags: ['bdes communication', 'graphic design', 'visual branding'] },

  // 🌾 9. Agriculture
  { category: 'Agriculture', name: 'B.Sc Agriculture', tags: ['bsc agriculture', 'agri', 'farming', 'agronomy'] },
  { category: 'Agriculture', name: 'B.Sc Horticulture', tags: ['bsc horticulture', 'horticulture', 'fruits', 'gardening'] },
  { category: 'Agriculture', name: 'B.Sc Forestry', tags: ['bsc forestry', 'forest', 'wildlife', 'conservation'] },
  { category: 'Agriculture', name: 'B.Tech Agricultural Engineering', tags: ['btech agri', 'farm machinery', 'agricultural engineering'] },
  { category: 'Agriculture', name: 'B.Sc Food Technology', tags: ['bsc food tech', 'food processing', 'preservation'] },
  { category: 'Agriculture', name: 'B.Sc Dairy Technology', tags: ['bsc dairy technology', 'dairy farming', 'milk processing'] },
  { category: 'Agriculture', name: 'B.F.Sc – Fisheries Science', tags: ['bfsc', 'fisheries science', 'aquaculture', 'marine biology'] },

  // 🧑‍🏫 10. Education
  { category: 'Education', name: 'B.Ed', tags: ['bed', 'bachelor of education', 'teaching', 'pedagogy', 'school teacher'] },
  { category: 'Education', name: 'B.El.Ed', tags: ['beled', 'elementary education', 'primary teaching'] },
  { category: 'Education', name: 'B.P.Ed', tags: ['bped', 'physical education', 'sports training', 'coach'] },
  { category: 'Education', name: 'D.El.Ed (Diploma, not degree)', tags: ['deled', 'diploma education', 'primary teacher', 'diploma'] },
  { category: 'Education', name: 'M.Ed – Master of Education', tags: ['med', 'masters education', 'postgraduate'] },

  // 📰 11. Media & Communication
  { category: 'Media & Communication', name: 'BJMC – Journalism & Mass Communication', tags: ['bjmc', 'journalism', 'mass com', 'media', 'reporting'] },
  { category: 'Media & Communication', name: 'BA Journalism', tags: ['ba journalism', 'print media', 'news anchor'] },
  { category: 'Media & Communication', name: 'BA Mass Communication', tags: ['ba mass communication', 'broadcasting', 'pr'] },
  { category: 'Media & Communication', name: 'B.Sc Visual Communication', tags: ['bsc viscom', 'visual communication', 'film', 'photography'] },
  { category: 'Media & Communication', name: 'Bachelor of Film & Television', tags: ['bftv', 'film making', 'cinema', 'television', 'directing'] },
  { category: 'Media & Communication', name: 'Bachelor of Multimedia', tags: ['multimedia', 'vfx', 'digital content', 'graphics'] },
  { category: 'Media & Communication', name: 'Bachelor of Animation', tags: ['animation', '3d modeling', 'vfx', 'character design'] },
  { category: 'Media & Communication', name: 'B.A. Digital Media', tags: ['digital media', 'content creation', 'social media', 'podcasting'] },

  // 🧳 12. Hotel, Tourism & Hospitality
  { category: 'Hotel, Tourism & Hospitality', name: 'BHM – Hotel Management', tags: ['bhm', 'hotel management', 'culinary', 'hospitality'] },
  { category: 'Hotel, Tourism & Hospitality', name: 'B.Sc Hospitality & Hotel Administration', tags: ['bsc hospitality', 'hotel administration', 'resort management'] },
  { category: 'Hotel, Tourism & Hospitality', name: 'BBA Tourism', tags: ['bba tourism', 'travel and tourism', 'tourism marketing'] },
  { category: 'Hotel, Tourism & Hospitality', name: 'Bachelor of Tourism Management', tags: ['btm', 'tourism management', 'travel agency'] },
  { category: 'Hotel, Tourism & Hospitality', name: 'BTTM – Bachelor of Travel & Tourism Management', tags: ['bttm', 'travel and tourism', 'destination management'] },

  // 🧪 13. Food & Nutrition
  { category: 'Food & Nutrition', name: 'B.Sc Food Science', tags: ['bsc food science', 'food microbiology', 'quality control'] },
  { category: 'Food & Nutrition', name: 'B.Sc Nutrition & Dietetics', tags: ['bsc nutrition', 'dietetics', 'dietitian', 'clinical nutrition'] },
  { category: 'Food & Nutrition', name: 'B.Sc Food Technology', tags: ['bsc food technology', 'food preservation', 'safety'] },
  { category: 'Food & Nutrition', name: 'B.Tech Food Technology', tags: ['btech food technology', 'food engineering', 'packaging'] },
  { category: 'Food & Nutrition', name: 'B.Sc Clinical Nutrition', tags: ['bsc clinical nutrition', 'hospital dietitian', 'health'] },

  // 🐾 14. Veterinary
  { category: 'Veterinary', name: 'BVSc & AH – Bachelor of Veterinary Science & Animal Husbandry', tags: ['bvsc', 'veterinary science', 'animal husbandry', 'animal doctor', 'vet'] },

  // 🛍️ 15. Other Professional Degrees
  { category: 'Other Professional Degrees', name: 'B.Voc – Bachelor of Vocation', tags: ['bvoc', 'vocational training', 'skill development', 'industry ready'] },
  { category: 'Other Professional Degrees', name: 'Bachelor of Library & Information Science', tags: ['blisc', 'library science', 'information management', 'librarian'] },
  { category: 'Other Professional Degrees', name: 'Bachelor of Social Work', tags: ['bsw', 'social work', 'community development', 'ngo'] },
  { category: 'Other Professional Degrees', name: 'Bachelor of Physiotherapy', tags: ['bpt', 'physiotherapy', 'rehab', 'exercise therapy'] },
  { category: 'Other Professional Degrees', name: 'Bachelor of Optometry', tags: ['b optom', 'optometry', 'vision care', 'eye specialist'] },
  { category: 'Other Professional Degrees', name: 'Bachelor of Event Management', tags: ['event management', 'wedding planning', 'corporate events', 'entertainment'] },
];

export const CATEGORIES = [
  'All Streams',
  'Arts & Humanities',
  'Computer & IT',
  'Science',
  'Engineering',
  'Commerce & Management',
  'Medical & Healthcare',
  'Law',
  'Architecture & Design',
  'Agriculture',
  'Education',
  'Media & Communication',
  'Hotel, Tourism & Hospitality',
  'Food & Nutrition',
  'Veterinary',
  'Other Professional Degrees',
];

export const DegreeSelect = ({
  value = '',
  onChange,
  placeholder = 'Search degree or enter your field (e.g. B.Tech CSE, BCA, B.Sc...)',
  className = '',
  rounded = 'rounded-full',
  id = 'degree-select-input',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [selectedCategory, setSelectedCategory] = useState('All Streams');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const pillsRef = useRef(null);

  const scrollPills = (direction) => {
    if (pillsRef.current) {
      const amount = direction === 'left' ? -160 : 160;
      pillsRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Synchronize internal search term with external value changes
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Handle outside click to dismiss dropdown smoothly
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered degree recommendations with acronym & keyword matching
  const filteredDegrees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return INDIAN_DEGREES.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'All Streams' && item.category !== selectedCategory) {
        return false;
      }

      // If no query, return matching category
      if (!query) return true;

      // 2. Direct string match
      const nameMatch = item.name.toLowerCase().includes(query);
      if (nameMatch) return true;

      // 3. Tag / Acronym match (e.g. 'cse', 'bca', 'ece', 'ai', 'aiml', 'mech', 'civil')
      const tagMatch = item.tags.some((tag) => tag.includes(query) || query.includes(tag));
      if (tagMatch) return true;

      return false;
    });
  }, [searchTerm, selectedCategory]);

  const handleSelectDegree = (degreeName) => {
    setSearchTerm(degreeName);
    if (onChange) onChange(degreeName);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onChange) onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchTerm('');
    if (onChange) onChange('');
    if (inputRef.current) inputRef.current.focus();
  };

  const isExactMatch = INDIAN_DEGREES.some(
    (d) => d.name.toLowerCase() === searchTerm.trim().toLowerCase()
  );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          disabled={disabled}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-[#EE2D02] focus:ring-2 focus:ring-[#EE2D02]/15 ${rounded} pl-4 pr-16 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 font-sans shadow-2xs`}
        />

        {/* Action Buttons: Clear & Dropdown Chevron */}
        <div className="absolute right-3 flex items-center gap-1.5 text-slate-400">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
              title="Clear Selection"
              aria-label="Clear Selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:text-slate-700 rounded-full transition-transform cursor-pointer"
            aria-label="Toggle Degree Menu"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#EE2D02]' : 'text-slate-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-80 flex flex-col font-sans">
          {/* Category Filter Pills with Prominent Left & Right Scroll Buttons */}
          <div className="relative border-b border-slate-200/80 bg-slate-50/95 flex items-center px-2 py-2 shrink-0 select-none gap-1.5">
            {/* Scroll Left Button */}
            <button
              type="button"
              onClick={() => scrollPills('left')}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-slate-700 hover:text-white hover:bg-[#EE2D02] hover:border-[#EE2D02] border border-slate-300 shadow-xs transition-all shrink-0 cursor-pointer active:scale-90"
              title="Scroll Streams Left"
              aria-label="Scroll Streams Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Pills Row with Wheel & Visible Custom Micro Scrollbar */}
            <div
              ref={pillsRef}
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              className="flex-1 flex items-center gap-1.5 overflow-x-auto py-0.5 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100"
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={(e) => {
                    setSelectedCategory(cat);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#EE2D02] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scroll Right Button */}
            <button
              type="button"
              onClick={() => scrollPills('right')}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-slate-700 hover:text-white hover:bg-[#EE2D02] hover:border-[#EE2D02] border border-slate-300 shadow-xs transition-all shrink-0 cursor-pointer active:scale-90"
              title="Scroll Streams Right"
              aria-label="Scroll Streams Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 [scrollbar-width:thin] text-left">
            {/* Custom Typed Option (if user types a unique specialization) */}
            {searchTerm.trim() && !isExactMatch && (
              <div
                onClick={() => handleSelectDegree(searchTerm.trim())}
                className="p-3 bg-amber-50/60 hover:bg-amber-100/70 cursor-pointer flex items-center justify-between transition-colors border-b border-amber-100 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="text-xs truncate">
                    <span className="text-slate-500 font-normal">Use custom degree: </span>
                    <span className="font-bold text-amber-900 font-mono">
                      "{searchTerm.trim()}"
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                  Custom Entry
                </span>
              </div>
            )}

            {filteredDegrees.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No matching degree found</p>
                <p className="text-[11px] text-slate-400">
                  You can still save your typed degree: <strong className="text-slate-800">"{searchTerm}"</strong>
                </p>
                {searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelectDegree(searchTerm.trim())}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#EE2D02] hover:bg-[#D02600] transition-all cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Select "{searchTerm.trim()}"</span>
                  </button>
                )}
              </div>
            ) : (
              filteredDegrees.map((item, index) => {
                const isSelected =
                  searchTerm.trim().toLowerCase() === item.name.toLowerCase();

                return (
                  <div
                    key={index}
                    onClick={() => handleSelectDegree(item.name)}
                    className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-50 group ${
                      isSelected ? 'bg-[#FFF1EE] text-[#EE2D02] font-semibold' : 'text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-medium truncate group-hover:text-[#EE2D02] transition-colors">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                        {item.category}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#EE2D02] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Footer Summary */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>{filteredDegrees.length} Indian degrees available</span>
            <span>Type to search or enter custom</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DegreeSelect;
