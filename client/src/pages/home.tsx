import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import turtleLogo from "@assets/generated_images/Girl_turtle_talking_on_phone_d147f854.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Users, Heart, Shuffle, Copy, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INSTRUCTIONS = {
  en: {
    name: "English",
    flag: "🇺🇸",
    howItWorks: "How it works:",
    step1: "🎲 Click the shuffle button to generate a room ID",
    step2: "📱 Share the room ID with your partner",
    step3: "🎯 Both click \"Start Call\" or \"Join Call\" with the same ID",
    step4: "🗣️ Speak and see live translation below videos",
    step5: "💕 Perfect for multilingual conversations!"
  },
  vi: {
    name: "Tiếng Việt",
    flag: "🇻🇳",
    howItWorks: "Cách sử dụng:",
    step1: "🎲 Nhấn nút xáo trộn để tạo mã phòng",
    step2: "📱 Chia sẻ mã phòng với đối tác của bạn",
    step3: "🎯 Cả hai nhấn \"Start Call\" hoặc \"Join Call\" với cùng mã",
    step4: "🗣️ Nói chuyện và xem bản dịch trực tiếp bên dưới video",
    step5: "💕 Hoàn hảo cho cuộc trò chuyện đa ngôn ngữ!"
  },
  es: {
    name: "Español",
    flag: "🇪🇸",
    howItWorks: "Cómo funciona:",
    step1: "🎲 Haz clic en el botón de mezclar para generar un ID de sala",
    step2: "📱 Comparte el ID de sala con tu compañero",
    step3: "🎯 Ambos hagan clic en \"Start Call\" o \"Join Call\" con el mismo ID",
    step4: "🗣️ Habla y ve la traducción en vivo debajo de los videos",
    step5: "💕 ¡Perfecto para conversaciones multilingües!"
  },
  fr: {
    name: "Français",
    flag: "🇫🇷",
    howItWorks: "Comment ça marche:",
    step1: "🎲 Cliquez sur le bouton mélanger pour générer un ID de salle",
    step2: "📱 Partagez l'ID de salle avec votre partenaire",
    step3: "🎯 Les deux cliquent sur \"Start Call\" ou \"Join Call\" avec le même ID",
    step4: "🗣️ Parlez et voyez la traduction en direct sous les vidéos",
    step5: "💕 Parfait pour les conversations multilingues!"
  },
  de: {
    name: "Deutsch",
    flag: "🇩🇪",
    howItWorks: "So funktioniert es:",
    step1: "🎲 Klicken Sie auf die Mischen-Taste um eine Raum-ID zu erstellen",
    step2: "📱 Teilen Sie die Raum-ID mit Ihrem Partner",
    step3: "🎯 Beide klicken auf \"Start Call\" oder \"Join Call\" mit derselben ID",
    step4: "🗣️ Sprechen Sie und sehen Sie die Live-Übersetzung unter den Videos",
    step5: "💕 Perfekt für mehrsprachige Gespräche!"
  },
  it: {
    name: "Italiano",
    flag: "🇮🇹",
    howItWorks: "Come funziona:",
    step1: "🎲 Clicca il pulsante mescola per generare un ID stanza",
    step2: "📱 Condividi l'ID stanza con il tuo partner",
    step3: "🎯 Entrambi cliccate su \"Start Call\" o \"Join Call\" con lo stesso ID",
    step4: "🗣️ Parla e vedi la traduzione in tempo reale sotto i video",
    step5: "💕 Perfetto per conversazioni multilingue!"
  },
  pt: {
    name: "Português",
    flag: "🇧🇷",
    howItWorks: "Como funciona:",
    step1: "🎲 Clique no botão embaralhar para gerar um ID de sala",
    step2: "📱 Compartilhe o ID da sala com seu parceiro",
    step3: "🎯 Ambos cliquem em \"Start Call\" ou \"Join Call\" com o mesmo ID",
    step4: "🗣️ Fale e veja a tradução ao vivo abaixo dos vídeos",
    step5: "💕 Perfeito para conversas multilíngues!"
  },
  ru: {
    name: "Русский",
    flag: "🇷🇺",
    howItWorks: "Как это работает:",
    step1: "🎲 Нажмите кнопку перемешать, чтобы создать ID комнаты",
    step2: "📱 Поделитесь ID комнаты с вашим партнером",
    step3: "🎯 Оба нажмите \"Start Call\" или \"Join Call\" с одинаковым ID",
    step4: "🗣️ Говорите и смотрите живой перевод под видео",
    step5: "💕 Идеально для многоязычных разговоров!"
  },
  ja: {
    name: "日本語",
    flag: "🇯🇵",
    howItWorks: "使い方:",
    step1: "🎲 シャッフルボタンをクリックしてルームIDを生成",
    step2: "📱 ルームIDをパートナーと共有",
    step3: "🎯 両者が同じIDで「Start Call」または「Join Call」をクリック",
    step4: "🗣️ 話して、ビデオの下にリアルタイム翻訳を見る",
    step5: "💕 多言語の会話に最適!"
  },
  ko: {
    name: "한국어",
    flag: "🇰🇷",
    howItWorks: "사용 방법:",
    step1: "🎲 셔플 버튼을 클릭하여 방 ID 생성",
    step2: "📱 파트너와 방 ID 공유",
    step3: "🎯 같은 ID로 \"Start Call\" 또는 \"Join Call\" 클릭",
    step4: "🗣️ 말하고 비디오 아래에서 실시간 번역 보기",
    step5: "💕 다국어 대화에 완벽!"
  },
  zh: {
    name: "中文",
    flag: "🇨🇳",
    howItWorks: "使用方法:",
    step1: "🎲 点击随机按钮生成房间ID",
    step2: "📱 与您的伙伴分享房间ID",
    step3: "🎯 双方使用相同ID点击\"Start Call\"或\"Join Call\"",
    step4: "🗣️ 说话并在视频下方查看实时翻译",
    step5: "💕 多语言对话的完美选择!"
  },
  ar: {
    name: "العربية",
    flag: "🇸🇦",
    howItWorks: "كيف يعمل:",
    step1: "🎲 انقر على زر الخلط لإنشاء معرف الغرفة",
    step2: "📱 شارك معرف الغرفة مع شريكك",
    step3: "🎯 كلاهما ينقر على \"Start Call\" أو \"Join Call\" بنفس المعرف",
    step4: "🗣️ تحدث وشاهد الترجمة المباشرة أسفل الفيديو",
    step5: "💕 مثالي للمحادثات متعددة اللغات!"
  },
  hi: {
    name: "हिन्दी",
    flag: "🇮🇳",
    howItWorks: "यह कैसे काम करता है:",
    step1: "🎲 रूम आईडी बनाने के लिए शफल बटन पर क्लिक करें",
    step2: "📱 अपने साथी के साथ रूम आईडी साझा करें",
    step3: "🎯 दोनों एक ही आईडी के साथ \"Start Call\" या \"Join Call\" पर क्लिक करें",
    step4: "🗣️ बोलें और वीडियो के नीचे लाइव अनुवाद देखें",
    step5: "💕 बहुभाषी बातचीत के लिए एकदम सही!"
  },
  th: {
    name: "ไทย",
    flag: "🇹🇭",
    howItWorks: "วิธีใช้งาน:",
    step1: "🎲 คลิกปุ่มสุ่มเพื่อสร้าง ID ห้อง",
    step2: "📱 แชร์ ID ห้องกับคู่สนทนาของคุณ",
    step3: "🎯 ทั้งคู่คลิก \"Start Call\" หรือ \"Join Call\" ด้วย ID เดียวกัน",
    step4: "🗣️ พูดและดูการแปลสดใต้วิดีโอ",
    step5: "💕 เหมาะสำหรับการสนทนาหลายภาษา!"
  }
};

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [instructionLang, setInstructionLang] = useState("en");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const currentInstructions = INSTRUCTIONS[instructionLang as keyof typeof INSTRUCTIONS] || INSTRUCTIONS.en;

  // Load saved room ID when page loads
  useEffect(() => {
    const savedRoomId = localStorage.getItem("turtleExchangeRoomId");
    const savedIsHost = localStorage.getItem("turtleExchangeIsHost");
    if (savedRoomId) {
      setRoomId(savedRoomId);
      setIsHost(savedIsHost === "true");
    }
  }, []);

  // Save room ID whenever it changes
  useEffect(() => {
    if (roomId.trim()) {
      localStorage.setItem("turtleExchangeRoomId", roomId);
    }
  }, [roomId]);

  const generateRoomId = () => {
    const newRoomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    setRoomId(newRoomId);
    setIsHost(true);
    localStorage.setItem("turtleExchangeIsHost", "true");
    toast({
      title: "Room ID Generated!",
      description: "You're the host! Share this ID with your partner.",
    });
  };

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomId(e.target.value);
    setIsHost(false);
    localStorage.setItem("turtleExchangeIsHost", "false");
  };

  const copyRoomId = () => {
    if (roomId.trim()) {
      navigator.clipboard.writeText(roomId);
      toast({
        title: "Room ID Copied!",
        description: "Share this with your partner to join the call.",
      });
    }
  };

  const clearRoomId = () => {
    setRoomId("");
    setIsHost(false);
    localStorage.removeItem("turtleExchangeRoomId");
    localStorage.removeItem("turtleExchangeIsHost");
    toast({
      title: "Room ID Cleared",
      description: "Generate a new room ID to start fresh.",
    });
  };

  // Save selected language to call settings before navigating
  const saveLanguageAndNavigate = (targetRoomId: string) => {
    // Get existing settings or create new ones
    const existingSettings = localStorage.getItem('turtle-exchange-settings');
    let settings = { yourLanguage: 'en', partnerLanguage: 'vi' };
    
    if (existingSettings) {
      try {
        settings = JSON.parse(existingSettings);
      } catch (e) {
        // Use defaults
      }
    }
    
    // Update with selected instruction language as user's speaking language
    settings.yourLanguage = instructionLang;
    localStorage.setItem('turtle-exchange-settings', JSON.stringify(settings));
    
    navigate(`/call/${targetRoomId}`);
  };

  const startCall = () => {
    if (roomId.trim()) {
      saveLanguageAndNavigate(roomId.trim());
    } else {
      // Generate a room ID if none exists
      const newRoomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      saveLanguageAndNavigate(newRoomId);
    }
  };

  const joinCall = () => {
    if (roomId.trim()) {
      saveLanguageAndNavigate(roomId.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      joinCall();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800" data-testid="home-page">
      <div className="w-full max-w-md p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center overflow-hidden">
              <img src={turtleLogo} alt="Turtle Exchange Logo" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Turtle Exchange</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <span>Video calls with</span>
            <Heart className="w-4 h-4 text-red-500" />
            <span>live translation</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">14 Languages Supported</p>
        </div>

        {/* Call Options */}
        <div className="space-y-4">
          {/* Room ID Input */}
          <Card data-testid="card-room-setup">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Video Call Room
              </CardTitle>
              <CardDescription>
                Person 1: Generate a room ID | Person 2: Enter the shared room ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={isHost ? "Share this room ID..." : "Enter room ID to join..."}
                  value={roomId}
                  onChange={handleRoomIdChange}
                  onKeyDown={handleKeyPress}
                  data-testid="input-room-id"
                  className="flex-1"
                />
                {!isHost && (
                  <Button 
                    onClick={generateRoomId}
                    variant="outline"
                    size="icon"
                    data-testid="button-generate-room"
                    title="Generate new room ID"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                )}
                {roomId.trim() && isHost && (
                  <Button 
                    onClick={copyRoomId}
                    variant="outline"
                    size="icon"
                    data-testid="button-copy-room"
                    title="Copy room ID to share"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {isHost ? (
                <div className="space-y-2">
                  <Button 
                    onClick={startCall} 
                    className="w-full"
                    disabled={!roomId.trim()}
                    data-testid="button-start-call"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Start Call
                  </Button>
                  <Button 
                    onClick={clearRoomId} 
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    data-testid="button-new-room"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Create New Room Instead
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={joinCall} 
                  variant={roomId.trim() ? "default" : "outline"}
                  className="w-full"
                  disabled={!roomId.trim()}
                  data-testid="button-join-call"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {roomId.trim() ? 'Join Call' : 'Enter Room ID or Generate New'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions with Language Selector */}
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <Select value={instructionLang} onValueChange={setInstructionLang}>
              <SelectTrigger className="w-[180px]" data-testid="select-instruction-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INSTRUCTIONS).map(([code, lang]) => (
                  <SelectItem key={code} value={code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground text-center space-y-2">
            <p><strong>{currentInstructions.howItWorks}</strong></p>
            <p>{currentInstructions.step1}</p>
            <p>{currentInstructions.step2}</p>
            <p>{currentInstructions.step3}</p>
            <p>{currentInstructions.step4}</p>
            <p>{currentInstructions.step5}</p>
          </div>
        </div>
      </div>
    </div>
  );
}