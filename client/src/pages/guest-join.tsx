import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import turtleLogo from "@assets/generated_images/Girl_turtle_talking_on_phone_d147f854.png";

const LANGUAGES: Record<string, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇺🇸" },
  vi: { name: "Vietnamese", flag: "🇻🇳" },
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
  de: { name: "German", flag: "🇩🇪" },
  it: { name: "Italian", flag: "🇮🇹" },
  pt: { name: "Portuguese", flag: "🇧🇷" },
  ru: { name: "Russian", flag: "🇷🇺" },
  ja: { name: "Japanese", flag: "🇯🇵" },
  ko: { name: "Korean", flag: "🇰🇷" },
  zh: { name: "Chinese", flag: "🇨🇳" },
  ar: { name: "Arabic", flag: "🇸🇦" },
  hi: { name: "Hindi", flag: "🇮🇳" },
  th: { name: "Thai", flag: "🇹🇭" },
};

// UI Text for guests — translated to their language
const UI_TEXT: Record<string, Record<string, string>> = {
  vi: {
    'You\'ve been invited to a call': 'Bạn đã được mời tham gia cuộc gọi',
    'Enter your name and language to join — no account needed': 'Nhập tên và ngôn ngữ của bạn để tham gia — không cần tài khoản',
    'Room Code': 'Mã phòng',
    'Your Name': 'Tên của bạn',
    'How should we call you?': 'Chúng tôi gọi bạn là gì?',
    'Your Language': 'Ngôn ngữ của bạn',
    'Join Call →': 'Tham gia cuộc gọi →',
    'Have a SpeakEasy account?': 'Có tài khoản SpeakEasy?',
    'Sign in instead': 'Đăng nhập thay vì thế',
  },
  // Add more languages as needed
};

export default function GuestJoin() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");

  // Read language hints from the join URL (?hostLang=en&guestLang=vi)
  const searchParams = new URLSearchParams(window.location.search);
  const hostLang = searchParams.get('hostLang') || 'en';
  const suggestedGuestLang = searchParams.get('guestLang');

  const [language, setLanguage] = useState(() => {
    // Priority: URL param → saved guest pref → fallback 'en'
    if (suggestedGuestLang && LANGUAGES[suggestedGuestLang]) return suggestedGuestLang;
    try {
      const saved = JSON.parse(localStorage.getItem('speakeasy-guest') || '{}');
      if (saved.language && LANGUAGES[saved.language]) return saved.language;
    } catch {}
    return 'en';
  });

  // Get UI text in the selected language (default to English if not available)
  const getText = (key: string): string => {
    return UI_TEXT[language]?.[key] || key;
  };

  const handleJoin = () => {
    if (!name.trim()) {
      const errMsg = getText("Enter your name") || "Enter your name";
      toast({ title: errMsg, description: "We need your name so the other person knows who joined.", variant: "destructive" });
      return;
    }
    // Store guest info locally so the call page can use it
    localStorage.setItem("speakeasy-guest", JSON.stringify({ displayName: name.trim(), language, isGuest: true }));
    // Save settings — guest's own language + host's language as partner
    localStorage.setItem("speakeasy-settings", JSON.stringify({ yourLanguage: language, partnerLanguage: hostLang }));
    navigate(`/call/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center overflow-hidden shadow-lg">
              <img src={turtleLogo} alt="SpeakEasy" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">SpeakEasy</h1>
          <p className="text-muted-foreground text-sm mt-1">Video calls with live translation</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg">You've been invited to a call</CardTitle>
            <CardDescription>Enter your name and language to join — no account needed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Room code display */}
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Room Code</p>
              <p className="font-mono text-sm font-semibold text-foreground break-all">{roomId}</p>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Your Name</label>
              <Input
                placeholder="How should we call you?"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                autoFocus
              />
            </div>

            {/* Language */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Your Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGES).map(([code, { name, flag }]) => (
                    <SelectItem key={code} value={code}>
                      {flag} {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleJoin} className="w-full" size="lg">
              Join Call →
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Have a SpeakEasy account?{" "}
              <button onClick={() => navigate("/")} className="text-primary hover:underline">
                Sign in instead
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
