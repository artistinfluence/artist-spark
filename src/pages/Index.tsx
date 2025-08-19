import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Waves, Music, Users, Zap, ArrowRight, LogIn, Settings } from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-2 rounded-lg shadow-glow">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SoundCloud Groups</h1>
              <p className="text-xs text-white/70">Artist Influence</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="text-white/60 hover:text-white/80 text-sm flex items-center gap-1.5 transition-colors"
              onClick={() => navigate("/auth?admin=true")}
            >
              <Settings className="h-3.5 w-3.5" />
              Admin Login
            </button>
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => navigate("/preview")}
            >
              Preview Tool
            </Button>
            <Button 
              className="bg-white/10 text-white hover:bg-white/20 gap-2"
              onClick={() => navigate("/auth")}
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl lg:text-7xl font-bold text-white leading-tight">
                Grow Your
                <br />
                <span className="bg-gradient-secondary bg-clip-text text-transparent">
                  Music Career
                </span>
              </h1>
              <p className="text-xl text-white/80 leading-relaxed max-w-lg">
                Join Artist Influence's exclusive SoundCloud engagement groups. 
                Connect with fellow artists, grow your reach, and build meaningful 
                relationships in the music community.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                className="bg-gradient-primary hover:shadow-glow text-lg px-8 py-6 gap-2"
                onClick={() => navigate("/auth")}
              >
                Join the Community
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6"
                onClick={() => navigate("/preview")}
              >
                Preview Your Support
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-white/70 text-sm">Active Artists</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10k+</div>
                <div className="text-white/70 text-sm">Tracks Supported</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">50+</div>
                <div className="text-white/70 text-sm">Genres Covered</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img 
              src={heroImage} 
              alt="SoundCloud Groups Dashboard" 
              className="w-full rounded-xl shadow-intense border border-white/20"
            />
            <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-xl" />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Our smart system matches you with artists in your genre for genuine, 
            balanced engagement that helps everyone grow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="bg-gradient-primary p-4 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Music className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Submit Your Track</h3>
            <p className="text-white/70">
              Upload your SoundCloud link and let our AI analyze your genre and style automatically.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="bg-gradient-secondary p-4 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Get Matched</h3>
            <p className="text-white/70">
              Our fairness algorithm connects you with artists who match your genre and engagement level.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="bg-gradient-to-r from-accent to-secondary p-4 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Grow Together</h3>
            <p className="text-white/70">
              Receive genuine reposts, likes, and comments while supporting others in return.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Amplify Your Music?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Join hundreds of artists who are already growing their SoundCloud presence 
            through our community-driven engagement platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gradient-primary hover:shadow-glow text-lg px-8 py-6 gap-2"
              onClick={() => navigate("/auth")}
            >
              Start Your Journey
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={() => navigate("/preview")}
            >
              Try Preview Tool
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-1.5 rounded-lg">
              <Waves className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">SoundCloud Groups</p>
              <p className="text-white/70 text-xs">by Artist Influence</p>
            </div>
          </div>
          <div className="text-white/70 text-sm">
            © 2024 Artist Influence. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
