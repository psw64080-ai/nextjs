"use client";

// 내 식물 목록 (B)  경로 : /plants

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPlants } from "../../service/plantsApi";
import PlantCard from "../../components/plants/PlantCard";

export default function PlantsPage() {
  const [plants, setPlants] = useState([]);       // 내 식물 목록
  const [loading, setLoading] = useState(true);   // 불러오는 중인지
  const [error, setError] = useState("");         // 실패 안내 문구

  // 목록을 서버에서 불러오는 함수
  async function loadPlants() {
    setLoading(true);
    setError("");
    try {
      const data = await getPlants();
      setPlants(data);
    } catch (e) {
      // 서버가 꺼져 있을 때도 여기로 온다.
      setError("내 식물을 불러오지 못했습니다. 서버가 켜져 있는지 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  // 화면이 처음 열릴 때 한 번 불러온다.
  useEffect(() => {
    loadPlants();
  }, []);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>내 식물</h2>
        <Link href="/plants/new">+ 내 식물 추가</Link>
      </div>

      {/* 1. 불러오는 중 */}
      {loading && <p>불러오는 중...</p>}

      {/* 2. 실패 : 실패를 성공처럼 보이지 않게 안내하고 다시 시도할 수 있게 한다. */}
      {!loading && error && (
        <div>
          <p>{error}</p>
          <button onClick={loadPlants}>다시 시도</button>
        </div>
      )}

      {/* 3. 식물이 하나도 없을 때 */}
      {!loading && !error && plants.length === 0 && (
        <p>
          등록한 내 식물이 없습니다. <Link href="/species">도감</Link>에서 식물을 찾아 추가해 보세요.
        </p>
      )}

      {/* 4. 목록 : 화면 폭에 맞춰 카드가 줄바꿈된다. */}
      {!loading && !error && plants.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: "12px",
          }}
        >
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}