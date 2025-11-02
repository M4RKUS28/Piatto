import { useTranslation } from 'react-i18next';

// Floating food icons with different animation timings
const FloatingIcon = ({ emoji, top, left, delay, duration, size = "text-4xl" }) => (
  <div
    className={`absolute ${size} opacity-10 pointer-events-none select-none`}
    style={{
      top,
      left,
      animation: `float ${duration}s ease-in-out ${delay}s infinite`,
    }}
  >
    {emoji}
  </div>
);

// Decorative shapes
const DecorativeShape = ({ type, top, left, size, color, delay }) => {
  const shapes = {
    circle: `w-${size} h-${size} rounded-full`,
    square: `w-${size} h-${size} rounded-sm rotate-45`,
    triangle: `w-0 h-0 border-l-[${size*4}px] border-r-[${size*4}px] border-b-[${size*6}px] border-l-transparent border-r-transparent`,
  };

  return (
    <div
      className={`absolute ${shapes[type]} ${color} opacity-20 pointer-events-none`}
      style={{
        top,
        left,
        animation: `float ${6 + delay}s ease-in-out ${delay}s infinite`,
      }}
    />
  );
};

export default function LibraryBackground({ children, username }) {
  const { t } = useTranslation(["recipe", "common"]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#E8E8E8] via-[#D8D8D8] to-[#C8C8C8]">
      {/* Animated CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.2; }
        }
      `}</style>

      {/* Decorative background circles */}
      <div className="absolute top-10 right-20 w-72 h-72 bg-[#FF9B7B]/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#FFD93D]/10 rounded-full blur-3xl" style={{ animation: 'pulse-glow 8s ease-in-out infinite' }}></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[#6BCF7F]/10 rounded-full blur-3xl" style={{ animation: 'pulse-glow 6s ease-in-out infinite 2s' }}></div>

      {/* Floating food icons */}
      <FloatingIcon emoji="🍕" top="10%" left="75%" delay="0" duration="6" />
      <FloatingIcon emoji="🍔" top="20%" left="85%" delay="1" duration="7" />
      <FloatingIcon emoji="🍝" top="40%" left="5%" delay="2" duration="8" size="text-5xl" />
      <FloatingIcon emoji="🍣" top="60%" left="90%" delay="0.5" duration="6.5" />
      <FloatingIcon emoji="🥗" top="75%" left="20%" delay="1.5" duration="7.5" />
      <FloatingIcon emoji="🍰" top="85%" left="75%" delay="1" duration="8" />
      <FloatingIcon emoji="🌮" top="70%" left="15%" delay="2" duration="7" />
      <FloatingIcon emoji="🍇" top="25%" left="25%" delay="1.5" duration="6" size="text-3xl" />
      <FloatingIcon emoji="🥑" top="80%" left="40%" delay="0" duration="8" />
      <FloatingIcon emoji="🍓" top="70%" left="4%" delay="2.5" duration="7.5" size="text-3xl" />
      <FloatingIcon emoji="🍪" top="55%" left="82%" delay="1" duration="6.5" />
      <FloatingIcon emoji="🥨" top="35%" left="92%" delay="3" duration="7" size="text-3xl" />

      {/* Additional smaller floating icons */}
      <FloatingIcon emoji="🥕" top="65%" left="15%" delay="1" duration="7" size="text-2xl" />
      <FloatingIcon emoji="🧀" top="48%" left="88%" delay="2.5" duration="6.5" size="text-2xl" />
      <FloatingIcon emoji="🥖" top="90%" left="60%" delay="0.5" duration="7.5" size="text-3xl" />
      <FloatingIcon emoji="🌶️" top="55%" left="25%" delay="1.5" duration="7" size="text-2xl" />
      <FloatingIcon emoji="🥒" top="82%" left="85%" delay="2" duration="6.5" size="text-2xl" />

      {/* Decorative corner patterns - Enhanced */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
        <div className="absolute top-8 right-8 w-2 h-2 bg-[#FFD93D] rounded-full"></div>
        <div className="absolute top-12 right-16 w-3 h-3 bg-[#FF9B7B] rounded-full"></div>
        <div className="absolute top-20 right-12 w-2 h-2 bg-[#6BCF7F] rounded-full"></div>
        <div className="absolute top-16 right-24 w-4 h-4 bg-[#FFD93D] rounded-full"></div>
        <div className="absolute top-24 right-8 w-2 h-2 bg-[#FF9B7B] rounded-full"></div>
        <div className="absolute top-28 right-20 w-3 h-3 bg-[#6BCF7F] rounded-full"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-64 h-64 opacity-5">
        <div className="absolute bottom-8 left-8 w-2 h-2 bg-[#FF9B7B] rounded-full"></div>
        <div className="absolute bottom-16 left-12 w-3 h-3 bg-[#FFD93D] rounded-full"></div>
        <div className="absolute bottom-12 left-20 w-2 h-2 bg-[#6BCF7F] rounded-full"></div>
        <div className="absolute bottom-20 left-16 w-4 h-4 bg-[#FF9B7B] rounded-full"></div>
        <div className="absolute bottom-24 left-8 w-2 h-2 bg-[#6BCF7F] rounded-full"></div>
        <div className="absolute bottom-28 left-24 w-3 h-3 bg-[#FFD93D] rounded-full"></div>
      </div>

      {/* Decorative shapes scattered around */}
      <div className="absolute top-32 left-10 w-3 h-3 bg-[#FF9B7B]/20 rounded-full"></div>
      <div className="absolute top-40 left-20 w-2 h-2 bg-[#FFD93D]/20 rounded-full"></div>
      <div className="absolute bottom-32 right-16 w-4 h-4 bg-[#6BCF7F]/20 rounded-full"></div>
      <div className="absolute bottom-48 right-32 w-2 h-2 bg-[#FF9B7B]/20 rounded-full"></div>
      <div className="absolute top-1/2 right-10 w-3 h-3 bg-[#FFD93D]/20 rounded-full"></div>
      <div className="absolute top-1/3 left-32 w-2 h-2 bg-[#6BCF7F]/20 rounded-full"></div>

      {/* Wavy lines decoration */}
      <div className="absolute top-1/4 left-0 w-32 h-1 bg-gradient-to-r from-transparent via-[#FF9B7B]/10 to-transparent"></div>
      <div className="absolute bottom-1/4 right-0 w-32 h-1 bg-gradient-to-l from-transparent via-[#FFD93D]/10 to-transparent"></div>

      {/* Main content container */}
      <div className="relative z-10 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#035035] drop-shadow">
                Welcome Back, {username || 'Chef'}! 👋
              </h1>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
