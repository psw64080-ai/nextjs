
const API_SERVER = (
    process.env.NEXT_PUBLIC_API_SERVER ||
    "http://127.0.0.1:8000"
).replace(/\/$/, "");


// 공통 서버 통신 함수
async function request(path, options = {}) {

    const response = await fetch(
        `${API_SERVER}${path}`,
        options
    );

    // 서버에서 오류 응답을 받은 경우
    if (!response.ok) {

        const error = await response.json()
            .catch(() => ({}));

        const detail = error.detail;

        const message = Array.isArray(detail)
            ? detail.map(item => item.msg).join(" / ")
            : detail;

        throw new Error(
            message || `요청 실패 (${response.status})`
        );
    }

    if (response.status === 204) return null;

    return await response.json();
}


// 1. 내 식물 전체 조회
export async function getAllPlants() {

    return await request("/plants", {
        cache: "no-store"
    });
}


// 2. 내 식물 상세 조회 (C 담당 API)
export async function getPlantById(id) {

    return await request(`/plants/${id}`, {
        cache: "no-store"
    });
}


// 3. 내 식물 등록
export async function addPlant(formData) {

    return await request("/plants", {
        method: "POST",
        body: formData
    });
}


// 4. 내 식물 수정
export async function updatePlant(id, formData) {

    return await request(`/plants/${id}`, {
        method: "PUT",
        body: formData
    });
}


// 5. 내 식물 삭제
export async function deletePlant(id) {

    return await request(`/plants/${id}`, {
        method: "DELETE"
    });
}


// 6. 식물 도감 목록 조회 (A 담당 API)
export async function getSpecies({
    keyword = "",
    page = 1,
    size = 20
} = {}) {

    const query = new URLSearchParams({
        keyword,
        page: String(page),
        size: String(size)
    });

    return await request(`/species?${query}`, {
        cache: "no-store"
    });
}


// 7. 식물 도감 상세 조회
export async function getSpeciesById(id) {

    return await request(`/species/${id}`, {
        cache: "no-store"
    });
}


// 8. 사진 주소 변환
export function getPhotoUrl(photoUrl) {

    if (!photoUrl) return null;

    // 공공데이터 이미지 주소
    if (/^https?:\/\//i.test(photoUrl)) {
        return photoUrl;
    }

    // 백엔드에 업로드된 이미지 주소
    return `${API_SERVER}/${photoUrl.replace(/^\/+/, "")}`;
}
