import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  {
    title: "User Authentication & Portfolio Management",
    desc: "Secure registration, login, and portfolio management with OAuth 2.0/JWT. Manage multiple portfolios and assets with ease.",
    icon: "🔐",
  },
  {
    title: "Real-Time Price Tracking",
    desc: "Live updates for stocks, crypto, and bonds. Integrated with top market data APIs for accuracy.",
    icon: "⏱️",
  },
  {
    title: "Performance Reports & Analytics",
    desc: "Track gains, losses, and historical performance. Get growth, diversification, and risk insights.",
    icon: "📈",
  },
  {
    title: "Cross-Portfolio Comparison",
    desc: "Benchmark against indices and compare with peers for smarter investing.",
    icon: "📊",
  },
  {
    title: "Scalability & High Availability",
    desc: "Microservices, caching, and load balancing ensure reliability and speed.",
    icon: "⚡",
  },
  {
    title: "Security & Privacy",
    desc: "Enterprise-grade encryption, RBAC, GDPR/CCPA compliance, and anonymization.",
    icon: "🛡️",
  },
  {
    title: "Investment Alerts & News",
    desc: "Custom price and performance alerts. Personalized financial news feeds.",
    icon: "🔔",
  },
  {
    title: "Tax & Reporting Support",
    desc: "Capital gains tax reports and multi-currency support for global investors.",
    icon: "💸",
  },
  {
    title: "Personalization & Insights",
    desc: "Adaptive recommendations, session-based personalization, and admin dashboards.",
    icon: "✨",
  },
];

const stagger = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, type: "spring" },
  }),
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden text-white bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
      {/* Animated Background Shapes */}
      <div className="animated-bg">
        <div className="bg-shape bg-shape1"></div>
        <div className="bg-shape bg-shape2"></div>
        <div className="bg-shape bg-shape3"></div>
      </div>

      {/* Navbar */}
      <header className="w-full py-5 px-8 flex justify-between items-center shadow bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-100/80 sticky top-0 z-50 backdrop-blur-md">
        <motion.h1
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="text-2xl md:text-3xl font-extrabold text-indigo-700 tracking-tight flex items-center"
        >
          <span className="mr-2">📊</span>Investment Portfolio Tracker
        </motion.h1>
        <nav className="space-x-4">
          <Link
            to="/login"
            className="bg-green-800 hover:bg-green-900 text-white font-semibold px-5 py-2 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
          >
            Login
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center py-24 px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="z-10"
        >
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-extrabold leading-snug text-white drop-shadow-lg"
          >
            Track, Analyze & Grow Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-400 to-purple-400 animate-gradient">
              Investments
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mt-6 text-lg md:text-xl text-gray-200 max-w-2xl mx-auto"
          >
            All-in-one platform for stocks, crypto, and bonds. Real-time data,
            analytics, alerts, and personalized insights for smarter investing.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="mt-8 flex justify-center gap-4"
          >
            <Link
              to="/signup"
              className="bg-gradient-to-r mt-10 from-indigo-500 to-purple-500 hover:from-pink-500 hover:to-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-200 text-lg"
            >
              Get Started
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 md:px-16 relative z-10">
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-3xl md:text-4xl font-bold text-center mb-12 text-indigo-300"
        >
          Powerful Features for Modern Investors
        </motion.h3>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 8px 32px 0 rgba(99,102,241,0.25)",
              }}
              className="p-7 bg-white/20 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all flex flex-col items-center text-center border border-white/10"
            >
              <div className="text-4xl mb-4 drop-shadow">{feature.icon}</div>
              <h4 className="text-xl font-semibold text-indigo-200">
                {feature.title}
              </h4>
              <p className="mt-3 text-gray-200">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-6 md:px-16 text-center relative z-10">
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-3xl font-bold text-white mb-6"
        >
          Why Choose Investment Portfolio Tracker?
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-lg text-gray-200 max-w-3xl mx-auto"
        >
          In an increasingly digital world, investors need robust, secure, and
          insightful tools to manage their portfolios. Our platform empowers you
          with real-time data, advanced analytics, and personalized insights—so
          you can make smarter, faster investment decisions.
        </motion.p>
      </section>

      {/* Advanced Features */}
      <section className="py-20 px-6 md:px-16 relative z-10">
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-3xl font-bold text-center mb-10 text-indigo-300"
        >
          Advanced Capabilities
        </motion.h3>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            {
              title: "Investment Alerts & News",
              desc: "Set custom price and performance alerts. Get personalized news feeds for your assets.",
              icon: "🔔",
            },
            {
              title: "Tax & Reporting Support",
              desc: "Generate capital gains tax reports and manage multi-currency portfolios.",
              icon: "💹",
            },
            {
              title: "Personalization & Insights",
              desc: "Session-based recommendations, adaptive insights, and admin dashboards.",
              icon: "🧠",
            },
            {
              title: "Performance Monitoring & Analytics",
              desc: "Track engagement, run A/B tests, and monitor system health in real time.",
              icon: "📊",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              whileHover={{
                scale: 1.03,
                boxShadow: "0 8px 32px 0 rgba(168,139,250,0.18)",
              }}
              className="flex items-start gap-4 bg-white/20 backdrop-blur-xl p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all border border-white/10"
            >
              <div className="text-3xl">{item.icon}</div>
              <div>
                <h4 className="text-lg font-semibold text-indigo-200">
                  {item.title}
                </h4>
                <p className="text-gray-200">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm border-t border-gray-700 relative z-10">
        © {new Date().getFullYear()} Investment Portfolio Tracker. All rights
        reserved.
      </footer>
    </div>
  );
}
