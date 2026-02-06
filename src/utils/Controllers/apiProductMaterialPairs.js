import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiProductMaterialPairs {
    static getByProductId = async (productId) => {
        const response = await $api.get(`${BASE_URL}/product-materials/all/${productId}`)
        return response;
    }
    static Add = async (data) => {
        const response = await $api.post(`${BASE_URL}/product-materials`, data, { showSuccessToast: "Mahsulotga xomashyo biriktirildi" })
        return response;
    }
    static AddList = async (data) => {
        const response = await $api.post(`${BASE_URL}/product-materials/list`, data, { showSuccessToast: "Mahsulotga xomashyolar biriktirildi" })
        return response;
    }
    static Update = async (data, id) => {
        const response = await $api.put(`${BASE_URL}/product-materials/by-id/${id}`, data, { showSuccessToast: "Mahsulotga xomashyo juftligi o'zgartirildi" })
        return response;
    }
    static Delete = async (id) => {
        const response = await $api.delete(`${BASE_URL}/product-materials/${id}`, { showSuccessToast: "Mahsulotga xomashyo juftligi o'chirildi" })
        return response;
    }
}

export { apiProductMaterialPairs };