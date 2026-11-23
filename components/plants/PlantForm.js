"use client";

// 내 식물 입력 폼 (B)
// 추가(add)와 수정(edit)에서 같이 쓰는 폼이다.
// props
//   mode            : "add"(추가) 또는 "edit"(수정)
//   initial         : 처음에 채워둘 값 (수정할 때 기존 값, 추가할 때는 도감에서 넘어온 species_id)
//   currentPhotoUrl : 수정할 때 지금 쓰고 있는 사진 주소 (화면에서 쓸 수 있는 주소)
//   onSubmit        : 입력 검사를 통과하면 FormData를 넘겨서 호출하는 함수
//   submitting      : 저장 중인지 (저장 중에는 버튼을 막아서 두 번 저장되지 않게 한다.)
//   serverError     : 서버가 돌려준 실패 안내 문구

import { useState, useEffect } from "react";

const MAX_PHOTO = 5 * 1024 * 1024;   // 사진 최대 5MB
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// 오늘 날짜를 "2026-11-23" 형태로 (내 컴퓨터 시간 기준)
function todayString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const boxStyle = { marginBottom: "14px" };
const inputStyle = { display: "block", width: "100%", padding: "8px", marginTop: "4px" };
const errStyle = { color: "#c0392b", fontSize: "13px", marginTop: "4px" };

export default function PlantForm({
  mode = "add",
  initial = {},
  currentPhotoUrl = null,
  onSubmit,
  submitting = false,
  serverError = "",
}) {
  const isEdit = mode === "edit";

  // 입력칸의 값들을 상태로 관리한다.
  const [kind, setKind] = useState(initial.species_id ? "species" : "custom");  // 종류를 고르는 방법
  const [speciesId, setSpeciesId] = useState(initial.species_id ? String(initial.species_id) : "");
  const [customName, setCustomName] = useState("");
  const [nickname, setNickname] = useState(initial.nickname || "");
  const [interval, setInterval] = useState(String(initial.water_interval_days ?? 7));
  const [lastWatered, setLastWatered] = useState(todayString());
  const [purchase, setPurchase] = useState(initial.purchase_date || "");
  const [location, setLocation] = useState(initial.location || "");
  const [photo, setPhoto] = useState(null);           // 새로 고른 사진 파일
  const [preview, setPreview] = useState(null);       // 새로 고른 사진의 미리보기 주소
  const [removePhoto, setRemovePhoto] = useState(false);
  const [errors, setErrors] = useState({});           // 입력칸별 오류 문구

  // 사진을 고르면 미리보기 주소를 만들고, 다른 사진을 고르거나 화면을 떠나면 정리한다.
  useEffect(() => {
    if (!photo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  // 입력값 검사 : 오류가 있는 칸의 문구를 모아서 돌려준다.
  // (서버도 다시 검사하지만, 화면에서 먼저 알려주면 사용자가 바로 고칠 수 있다.)
  function validate() {
    const errs = {};

    if (nickname.trim().length < 1 || nickname.trim().length > 50) {
      errs.nickname = "별명은 1~50자로 입력해 주세요.";
    }
    if (interval === "" || !Number.isInteger(Number(interval)) || Number(interval) < 1) {
      errs.interval = "물주기 주기는 1 이상의 정수(일)로 입력해 주세요.";
    }

    // 종류와 마지막으로 물 준 날짜는 추가할 때만 입력한다.
    if (!isEdit) {
      if (kind === "species") {
        if (!Number.isInteger(Number(speciesId)) || Number(speciesId) < 1) {
          errs.species = "도감 번호를 입력해 주세요.";
        }
      } else if (customName.trim() === "") {
        errs.species = "종류를 입력해 주세요.";
      }
      if (lastWatered === "") {
        errs.lastWatered = "마지막으로 물 준 날짜를 입력해 주세요.";
      } else if (lastWatered > todayString()) {
        errs.lastWatered = "마지막으로 물 준 날짜는 오늘 이전이어야 합니다.";
      }
    }

    if (photo) {
      if (!PHOTO_TYPES.includes(photo.type)) {
        errs.photo = "jpg, png, webp 사진만 올릴 수 있습니다.";
      } else if (photo.size > MAX_PHOTO) {
        errs.photo = "사진은 5MB 이하만 올릴 수 있습니다.";
      }
    }
    return errs;
  }

  // 서버로 보낼 FormData를 만든다. (사진이 같이 가기 때문에 JSON이 아니라 FormData)
  function buildFormData() {
    const fd = new FormData();
    fd.append("nickname", nickname.trim());
    fd.append("water_interval_days", interval);

    if (!isEdit) {
      if (kind === "species") {
        fd.append("species_id", speciesId);
      } else {
        fd.append("custom_species_name", customName.trim());
      }
      fd.append("last_watered_at", lastWatered);
    }

    // 선택 항목 : 값이 있으면 보내고, 수정에서 원래 있던 값을 비웠다면
    // 공백 한 칸(" ")을 보내서 지운다. (빈 문자열은 서버가 '안 보냄'으로 처리해서 지워지지 않는다.)
    if (location.trim() !== "") {
      fd.append("location", location.trim());
    } else if (isEdit && initial.location) {
      fd.append("location", " ");
    }
    if (purchase !== "") {
      fd.append("purchase_date", purchase);
    } else if (isEdit && initial.purchase_date) {
      fd.append("purchase_date", " ");
    }

    if (photo) {
      fd.append("photo", photo);
    }
    if (isEdit && removePhoto && !photo) {
      fd.append("remove_photo", "true");
    }
    return fd;
  }

  function handleSubmit(e) {
    e.preventDefault();               // 화면이 새로고침되지 않게
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      return;                         // 오류가 있으면 서버로 보내지 않는다.
    }
    onSubmit(buildFormData());
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* 종류 : 추가할 때만 */}
      {!isEdit && (
        <div style={boxStyle}>
          <div>식물 종류 (필수)</div>
          <label>
            <input type="radio" checked={kind === "species"} onChange={() => setKind("species")} /> 도감 번호
          </label>{" "}
          <label>
            <input type="radio" checked={kind === "custom"} onChange={() => setKind("custom")} /> 직접 입력
          </label>
          {kind === "species" ? (
            <input
              style={inputStyle}
              type="number"
              min="1"
              placeholder="도감 번호 (예: 1)"
              value={speciesId}
              onChange={(e) => setSpeciesId(e.target.value)}
            />
          ) : (
            <input
              style={inputStyle}
              placeholder="식물 종류 (예: 무화과)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          )}
          {kind === "custom" && <div style={{ fontSize: "13px", opacity: 0.7 }}>직접 입력한 식물은 도감 정보가 없습니다.</div>}
          {errors.species && <div style={errStyle}>{errors.species}</div>}
        </div>
      )}

      <div style={boxStyle}>
        <label>
          별명 (필수)
          <input style={inputStyle} maxLength={50} value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </label>
        {errors.nickname && <div style={errStyle}>{errors.nickname}</div>}
      </div>

      <div style={boxStyle}>
        <label>
          물주기 주기 (일, 필수)
          <input style={inputStyle} type="number" min="1" value={interval} onChange={(e) => setInterval(e.target.value)} />
        </label>
        <div style={{ fontSize: "13px", opacity: 0.7 }}>도감의 물주기 안내는 참고용이고, 오늘 할 일은 여기서 정한 주기로 계산합니다.</div>
        {errors.interval && <div style={errStyle}>{errors.interval}</div>}
      </div>

      {!isEdit && (
        <div style={boxStyle}>
          <label>
            마지막으로 물 준 날짜 (필수)
            <input style={inputStyle} type="date" max={todayString()} value={lastWatered} onChange={(e) => setLastWatered(e.target.value)} />
          </label>
          {errors.lastWatered && <div style={errStyle}>{errors.lastWatered}</div>}
        </div>
      )}

      <div style={boxStyle}>
        <label>
          구매일 (선택)
          <input style={inputStyle} type="date" value={purchase} onChange={(e) => setPurchase(e.target.value)} />
        </label>
      </div>

      <div style={boxStyle}>
        <label>
          위치 (선택)
          <input style={inputStyle} placeholder="예: 거실 창가" value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>
      </div>

      <div style={boxStyle}>
        <label>
          대표 사진 (선택, jpg·png·webp, 5MB 이하)
          <input
            style={inputStyle}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhoto(e.target.files[0] || null)}
          />
        </label>
        {errors.photo && <div style={errStyle}>{errors.photo}</div>}

        {/* 새로 고른 사진 미리보기, 없으면 수정할 때 지금 쓰는 사진 */}
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="미리보기" style={{ width: "160px", marginTop: "8px", borderRadius: "8px" }} />
        ) : (
          isEdit && currentPhotoUrl && !removePhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentPhotoUrl} alt="현재 사진" style={{ width: "160px", marginTop: "8px", borderRadius: "8px" }} />
          )
        )}
        {isEdit && currentPhotoUrl && !photo && (
          <label style={{ display: "block", marginTop: "6px" }}>
            <input type="checkbox" checked={removePhoto} onChange={(e) => setRemovePhoto(e.target.checked)} /> 사진 지우기
          </label>
        )}
      </div>

      {/* 서버가 돌려준 실패 안내 : 실패를 성공처럼 보이지 않게 그대로 보여준다. */}
      {serverError && <div style={{ ...errStyle, marginBottom: "10px" }}>{serverError}</div>}

      <button type="submit" disabled={submitting}>
        {submitting ? "저장 중..." : isEdit ? "수정하기" : "저장하기"}
      </button>
    </form>
  );
}