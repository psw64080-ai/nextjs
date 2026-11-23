"use client";

// 내 식물 추가 (B)  경로 : /plants/new
// 도감 상세의 "내 식물로 추가" 버튼에서 오면 주소에 ?species_id=번호 가 붙어서 온다.

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { addPlant } from "../../../service/plantsApi";
import PlantForm from "../../../components/plants/PlantForm";

function NewPlant() {
  const router = useRouter();
  const params = useSearchParams();
  const speciesId = params.get("species_id");    // 도감에서 넘어온 번호 (없으면 null)

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // 폼 검사를 통과하면 호출된다. 서버에 저장하고 성공하면 목록으로 이동한다.
  async function handleSubmit(formData) {
    setSubmitting(true);
    setServerError("");
    try {
      await addPlant(formData);
      router.push("/plants");
    } catch (e) {
      // 서버가 꺼져 있을 때는 서버 문구가 없어서 기본 문구를 보여준다.
      setServerError(e.message || "저장하지 못했습니다. 서버가 켜져 있는지 확인해 주세요.");
      setSubmitting(false);     // 실패했을 때만 버튼을 다시 풀어준다.
    }
  }

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto", padding: "16px" }}>
      <h2>내 식물 추가</h2>
      <PlantForm
        mode="add"
        initial={{ species_id: speciesId }}
        onSubmit={handleSubmit}
        submitting={submitting}
        serverError={serverError}
      />
      <p style={{ marginTop: "16px" }}>
        <Link href="/plants">← 내 식물 목록</Link>
      </p>
    </div>
  );
}

// useSearchParams 를 쓰는 화면은 Suspense 로 감싸야 빌드할 때 오류가 나지 않는다.
export default function NewPlantPage() {
  return (
    <Suspense fallback={<p>불러오는 중...</p>}>
      <NewPlant />
    </Suspense>
  );
}