export default function AnimatedBackground() {
  return (
    <>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large animated gradient blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#A8C9B8]/30 to-[#035035]/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-[#FF9B7B]/25 to-[#FFF8F0]/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-[#035035]/10 to-[#A8C9B8]/15 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

        {/* Floating food emojis with bounce animation */}
        <div className="absolute top-20 left-[10%] text-4xl opacity-20 animate-float" style={{animationDelay: '0s'}}>🍕</div>
        <div className="absolute top-40 right-[15%] text-3xl opacity-15 animate-float" style={{animationDelay: '1s'}}>🍝</div>
        <div className="absolute bottom-32 left-[20%] text-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}>🥗</div>
        <div className="absolute bottom-48 right-[25%] text-4xl opacity-15 animate-float" style={{animationDelay: '1.5s'}}>🍜</div>
        <div className="absolute top-1/2 left-[5%] text-2xl opacity-10 animate-float" style={{animationDelay: '0.5s'}}>🍔</div>
        <div className="absolute top-1/3 right-[8%] text-3xl opacity-15 animate-float" style={{animationDelay: '2.5s'}}>🍰</div>

        {/* Smaller floating dots with different animations */}
        <div className="absolute top-24 left-1/4 w-2 h-2 bg-[#A8C9B8]/40 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-56 right-1/3 w-3 h-3 bg-[#FF9B7B]/30 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
        <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-[#035035]/30 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
        <div className="absolute bottom-56 right-1/4 w-3 h-3 bg-[#A8C9B8]/35 rounded-full animate-bounce" style={{animationDelay: '0.9s'}}></div>
      </div>

      {/* Add custom animations via style tag */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        .animate-blob {
          animation: blob 7s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
