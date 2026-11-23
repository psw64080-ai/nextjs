"use client";

// 내 식물 카드 한 장 (B)
// props : plant = {id, nickname, species_name, location, photo_url}

import { useState } from "react";
import Link from "next/link";
import { photoSrc } from "../../service/plantsApi";

export default function PlantCard({ plant }) {
  // 사진을 불러오지 못했는지 기억하는 상태 (외부 도감 사진은 주소가 깨질 수 있다.)
  const [imgFailed, setImgFailed] = useState(false);

  const src = photoSrc(plant.photo_url);

  return (
    <Link
      href={`/plants/${plant.id}`}
      style={{
        display: "block",
        border: "1px solid #ccc",
        borderRadius: "12px",
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {/* 사진이 있고 불러오기에 성공했을 때만 사진, 아니면 기본 이미지 */}
      {src && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={plant.nickname}
          onError={() => setImgFailed(true)}
          style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            height: "140px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
            background: "#eef4ec",
          }}
        >
          🪴
        </div>
      )}

      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontWeight: "bold" }}>{plant.nickname}</div>
        <div style={{ fontSize: "14px", opacity: 0.8 }}>{plant.species_name}</div>
        <div style={{ fontSize: "13px", opacity: 0.6 }}>
          {plant.location ? plant.location : "위치 미입력"}
        </div>
      </div>
    </Link>
  );
}