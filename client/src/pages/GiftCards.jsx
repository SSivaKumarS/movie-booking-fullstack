import { useState } from "react";

export default function GiftCards() {
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [generatedVoucher, setGeneratedVoucher] = useState(null);

  const cardThemes = [
    {
      id: "classic",
      name: "Cinematic Dark",
      bg: "bg-gradient-to-r from-red-900 via-gray-900 to-black border-red-500/50",
      badge: " CineBook Official",
    },
    {
      id: "gold",
      name: "VIP Gold Pass",
      bg: "bg-gradient-to-r from-amber-700 via-yellow-900 to-black border-amber-500/50",
      badge: " VIP Experience",
    },
    {
      id: "birthday",
      name: "Birthday Movie Feast",
      bg: "bg-gradient-to-r from-purple-900 via-pink-900 to-black border-pink-500/50",
      badge: " Birthday Special",
    },
  ];

  const handlePurchase = (e) => {
    e.preventDefault();
    const finalAmount = customAmount ? Number(customAmount) : amount;
    if (!finalAmount || finalAmount < 100) {
      alert("Minimum gift card value is ₹100");
      return;
    }
    if (!recipientEmail) {
      alert("Please enter recipient email");
      return;
    }

    const code = "CINEGIFT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedVoucher({
      code,
      amount: finalAmount,
      recipientName: recipientName || "Movie Lover",
      recipientEmail,
      theme: cardThemes.find((t) => t.id === selectedTheme),
    });
  };

  return (
    <div className="bg-[#07070B] min-h-screen text-white p-4 md:p-10 relative selection:bg-red-600 selection:text-white">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-red-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-black px-3 py-1 rounded-full uppercase">
             Gift Movies & Experiences
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            CineBook Gift Cards
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Send digital movie passes & snack vouchers instantly to friends and family
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Card Preview & Selection */}
          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400">
              1. Choose Gift Card Theme
            </h2>

            {/* Live Visual Card Preview */}
            <div
              className={`p-8 rounded-3xl border shadow-2xl space-y-8 relative overflow-hidden transition-all duration-500 ${
                cardThemes.find((t) => t.id === selectedTheme)?.bg
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-black/60 border border-white/10 text-gray-200">
                    {cardThemes.find((t) => t.id === selectedTheme)?.badge}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-3">CineBook Pass</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block uppercase">Gift Value</span>
                  <span className="text-2xl font-black text-white">
                    ₹{customAmount ? customAmount : amount}
                  </span>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 flex justify-between items-end text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">To Recipient</span>
                  <span className="font-bold text-white text-sm">
                    {recipientName || "Friend / Family"}
                  </span>
                </div>
                <div className="font-mono text-red-400 font-bold">●●●● CODE READY</div>
              </div>
            </div>

            {/* Theme Picker */}
            <div className="grid grid-cols-3 gap-3">
              {cardThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition ${
                    selectedTheme === theme.id
                      ? "border-red-500 bg-red-950/40 text-white shadow-lg"
                      : "border-gray-800 bg-gray-950/80 text-gray-400 hover:text-white"
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Details & Purchase Form */}
          <div className="bg-[#0F0F17]/90 border border-gray-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-6">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400">
              2. Enter Gift Amount & Details
            </h2>

            <form onSubmit={handlePurchase} className="space-y-4">
              
              {/* Preset Amounts */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">
                  Select Amount (₹)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[250, 500, 1000, 2000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setAmount(val);
                        setCustomAmount("");
                      }}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition ${
                        amount === val && !customAmount
                          ? "bg-red-600 border-red-500 text-white shadow-lg"
                          : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Details */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Recipient Name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                />

                <input
                  type="email"
                  placeholder="Recipient Email Address *"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                />

                <textarea
                  rows="2"
                  placeholder="Personal Gift Message (Optional)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-black py-4 rounded-2xl text-xs transition shadow-xl shadow-red-600/30 uppercase tracking-wider"
              >
                 Purchase Gift Pass Now
              </button>
            </form>
          </div>

        </div>

        {/* Voucher Delivery Modal */}
        {generatedVoucher && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-[#0F0F17] border border-gray-800 p-8 rounded-3xl text-center space-y-6 max-w-md w-full shadow-2xl relative">
              <div className="w-16 h-16 bg-emerald-600/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-3xl mx-auto">
                
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Gift Pass Generated!</h3>
                <p className="text-xs text-gray-400">
                  Sent to <span className="text-white font-bold">{generatedVoucher.recipientEmail}</span>
                </p>
              </div>

              <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl font-mono text-center space-y-1">
                <span className="text-[10px] text-gray-500 uppercase block">Redeemable Gift Code</span>
                <span className="text-xl font-black text-emerald-400 tracking-wider">
                  {generatedVoucher.code}
                </span>
                <span className="text-xs text-gray-400 block pt-1">
                  Value: ₹{generatedVoucher.amount}
                </span>
              </div>

              <button
                onClick={() => setGeneratedVoucher(null)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl text-xs transition"
              >
                Close & Return
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
