import { useEffect, useState } from "react";
import api from "../services/api";

function Products({ onLogout }) {
    const [products, setProducts] = useState([]);

    useEffect(() => {

        const token = localStorage.getItem("token");

        api.get("/products", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then((response) => {
            setProducts(response.data);
        })
        .catch((error) => {
            console.error("Error fetching products:", error);
        });

    }, []);

    return (
        <div>
            <h2>Products</h2>
            <button onClick={onLogout}>
    Logout
</button>

<br /><br />

            {products.length === 0 ? (
                <p>No products found.</p>
            ) : (
                products.map((product) => (
                    <div key={product.id}>
                        <h3>{product.name}</h3>
                        <p>Category: {product.category}</p>
                        <p>Price: ₹{product.current_price}</p>
                        <p>Stock: {product.stock}</p>
                        <hr />
                    </div>
                ))
            )}
        </div>
    );
}

export default Products;