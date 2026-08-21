import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  const socialLinks = ["Instagram", "Facebook", "X", "YouTube", "LinkedIn"];

  return (
    <footer className="bg-[#F8F5FF] border-t border-violet-200">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Brand */}
        <div className="grid lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center font-black">
                xc
              </div>

              <div>
                <h2 className="text-2xl font-bold text-violet-900">
                  Xaviercinema Studio
                </h2>
                <p className="text-sm text-violet-500">
                  Premium Movie Booking Experience
                </p>
              </div>
            </div>

            <p className="mt-4 text-slate-600 max-w-md">
              Discover movies, reserve seats, order snacks, and enjoy a
              seamless cinema experience.
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              {socialLinks.map((item) => (
                <button
                  key={item}
                  className="px-4 py-2 rounded-xl bg-white border border-violet-200 text-violet-700 hover:bg-violet-600 hover:text-white transition"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-violet-900 mb-4">
              Quick Links
            </h4>

            <ul className="space-y-3 text-slate-600">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/movies">Movies</Link></li>
              <li><Link to="/my-bookings">Bookings</Link></li>
              <li><Link to="/scanner">QR Scanner</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-violet-900 mb-4">
              Newsletter
            </h4>

            {subscribed ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700">
                Successfully subscribed!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-violet-200 rounded-xl px-4 py-3"
                />

                <button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 font-semibold"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* App CTA */}
        <div className="mt-16 bg-gradient-to-r from-violet-600 to-purple-700 rounded-3xl p-8 text-white flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">
              Download Xaviercinema Studio App
            </h3>
            <p className="text-violet-100 mt-2">
              Book tickets, track bookings, and access exclusive offers.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="bg-white text-violet-700 px-5 py-3 rounded-xl font-semibold">
              App Store
            </button>

            <button className="bg-white text-violet-700 px-5 py-3 rounded-xl font-semibold">
              Google Play
            </button>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-violet-200 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} Xaviercinema Studio. All rights reserved.
          </p>

          <div className="flex gap-6">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}