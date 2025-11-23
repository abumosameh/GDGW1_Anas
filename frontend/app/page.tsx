import TrendChart from "./TrendChart";

// 1. Define the Interface for the API response
interface TrendData {
  language: string;
  years: number[];
  counts: number[];
  growth_rate: number;
  verdict: string;
}

interface ApiResponse {
  trends: TrendData[];
}

// 2. Fetch Function
async function getTechTrends() {
  // Ensure your Flask backend is running on port 5000
  try {
    const res = await fetch("http://127.0.0.1:5000/api/bq", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    return { trends: [] };
  }
}

// 3. Main Page Component
export default async function Home() {
  const data: ApiResponse = await getTechTrends();

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2">
            Tech Stack Forecaster 🚀
          </h1>
          <p className="text-lg text-gray-600">
            Real-time analysis of programming language popularity using BigQuery.
          </p>
        </div>

        {/* The Chart Visualization */}
        <section>
          {data.trends.length > 0 ? (
            <TrendChart trends={data.trends} />
          ) : (
            <div className="text-center text-red-500 p-10 bg-white rounded shadow">
              <h2 className="text-xl font-bold">Backend Not Connected</h2>
              <p>Make sure your Flask app.py is running on port 5000!</p>
            </div>
          )}
        </section>

        {/* Footer / Hackathon Info */}
        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>Built for Sheridan Datathon 2025 • Powered by Google Cloud Platform</p>
        </div>
      </div>
    </main>
  );
}