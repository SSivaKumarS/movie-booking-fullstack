import { useState } from "react";

export default function LoyaltyWallet() {
  const [points, setPoints] = useState(380);
  const [redeemedCode, setRedeemedCode] = useState(null);

  const rewardVouchers = [
    {
      id: 1,
      title: " Free Large Cheese Popcorn",
      cost: 150,
      code: "POPCORN-FREE150",
      desc: "Redeem for 1 tub of gourmet cheese popcorn at any theater pantry.",
      badge: "Snack Perk",
    },
    {
      id: 2,
      title: " ₹100 Ticket Discount Voucher",
      cost: 200,
      code: "CINE100-POINT",
      desc: "Get ₹100 instant discount on any movie ticket checkout.",
      badge: "Ticket Pass",
    },
    {
      id: 3,
      title: " Free VIP Recliner Upgrade",
      cost: 300,
      code: "VIP-UPGRADE300",
      desc: "Upgrade standard executive seats to plush VIP recliners.",
      badge: "Luxury Perk",
    },
  ];

  const handleRedeem = (voucher) => {
    if (points < voucher.cost) {
      alert(`You need ${voucher.cost - points} more CinePoints to unlock this perk.`);
      return;
    }

    setPoints(points - voucher.cost);
    setRedeemedCode({
      title: voucher.title,
      code: voucher.code,
    });
  };

  return (
    <div className="bg-[#07070B] min-h-screen text-white p-4 md:p-10 relative selection:bg-red-600 selection:text-white">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#170E03] via-[#0F0F17] to-[#07070B] border border-amber-500/30 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
               CineClub Member Tier
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              CinePoints Rewards Wallet
            </h1>
            <p className="text-xs text-gray-400">
              Earn 10 CinePoints for every ₹100 spent on movie tickets and snacks
            </p>
          </div>

          {/* Points Balance Badge */}
          <div className="bg-gray-950/80 border border-amber-500/40 p-6 rounded-2xl text-center min-w-[200px] shadow-2xl">
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">
              Available Balance
            </span>
            <span className="text-4xl font-black text-amber-400 tracking-tight">
              {points} <span className="text-sm font-normal text-amber-300">pts</span>
            </span>
          </div>
        </div>

        {/* Redeem Rewards Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">
            Available Reward Vouchers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rewardVouchers.map((v) => {
              const canAfford = points >= v.cost;

              return (
                <div
                  key={v.id}
                  className="bg-[#0F0F17]/90 border border-gray-800/80 p-6 rounded-3xl backdrop-blur-2xl shadow-xl space-y-4 flex flex-col justify-between hover:border-amber-500/50 transition"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300">
                        {v.badge}
                      </span>
                      <span className="text-xs font-black text-amber-400 font-mono">
                        {v.cost} PTS
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-white">{v.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{v.desc}</p>
                  </div>

                  <button
                    onClick={() => handleRedeem(v)}
                    disabled={!canAfford}
                    className={`w-full font-bold py-3 rounded-2xl text-xs transition shadow-lg ${
                      canAfford
                        ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black shadow-amber-500/20"
                        : "bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed"
                    }`}
                  >
                    {canAfford ? "Redeem Reward Code" : `Need ${v.cost - points} More Pts`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Redeemed Voucher Alert Modal */}
        {redeemedCode && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-[#0F0F17] border border-amber-500/40 p-8 rounded-3xl text-center space-y-6 max-w-sm w-full shadow-2xl">
              <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center text-3xl mx-auto">
                
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white">{redeemedCode.title}</h3>
                <p className="text-xs text-gray-400">Use this voucher promo code at checkout</p>
              </div>

              <div className="bg-gray-950 border border-amber-500/30 p-4 rounded-2xl font-mono text-amber-400 font-black text-lg tracking-wider">
                {redeemedCode.code}
              </div>

              <button
                onClick={() => setRedeemedCode(null)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-2xl text-xs transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
