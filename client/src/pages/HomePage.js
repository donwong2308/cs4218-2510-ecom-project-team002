import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox, Radio } from "antd";
import { Prices } from "../components/Prices";
import { useCart } from "../context/cart";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from "./../components/Layout";
import { AiOutlineReload } from "react-icons/ai";
import "../styles/Homepages.css";

const asString = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));
const asNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const reqIdRef = useRef(0);

  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) setCategories(data?.category);
    } catch (error) {
      console.log(error);
    }
  };

  const getTotal = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/product-count");
      setTotal(data?.total);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllCategory();
    getTotal();
    getAllProducts(1, true);
  }, []);

  const getAllProducts = async (p = page, replace = false) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/${p}`);
      setLoading(false);
      if (replace) {
        setProducts(data.products);
      } else {
        setProducts((prev) => [...prev, ...data?.products]);
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  useEffect(() => {
    if (page === 1) return;
    if (checked.length === 0 && !radio) {
      getAllProducts(page, false);
    }
  }, [page]);

  const handleFilter = (value, id) => {
    let all = [...checked];
    if (value) all.push(id);
    else all = all.filter((c) => c !== id);
    setChecked(all);
    setPage(1);
  };

  const sanitizeRadioForPayload = (arr) => {
    if (!arr || arr.length !== 2) return [];
    const [min, max] = arr;
    const safeMax = Number.isFinite(max) ? max : 1_000_000_000;
    return [Number(min), Number(safeMax)];
  };

  const filterProduct = async (cats, priceRange) => {
    const id = ++reqIdRef.current;
    try {
      const payload = {
        checked: cats,
        radio: sanitizeRadioForPayload(priceRange),
      };
      const { data } = await axios.post(
        "/api/v1/product/product-filters",
        payload
      );
      if (id !== reqIdRef.current) return;
      setProducts(data?.products || []);
      setTotal((data?.products || []).length);
    } catch (error) {
      if (id !== reqIdRef.current) return;
      console.log(error);
    }
  };

  useEffect(() => {
    const noCategory = checked.length === 0;
    const noPrice = !radio || radio.length === 0;
    setPage(1);
    if (noCategory && noPrice) {
      getAllProducts(1, true);
      getTotal();
    } else {
      filterProduct(noCategory ? [] : checked, noPrice ? [] : radio);
    }
  }, [checked, radio]);

  return (
    <Layout title={"ALL Products - Best offers "}>
      <img
        src="/images/Virtual.png"
        className="banner-img"
        alt="bannerimage"
        width={"100%"}
      />
      <div className="container-fluid row mt-3 home-page">
        <div className="col-md-3 filters">
          <h4 className="text-center">Filter By Category</h4>
          <div className="d-flex flex-column">
            {categories?.map((c) => (
              <Checkbox
                key={c._id}
                onChange={(e) => handleFilter(e.target.checked, c._id)}
              >
                {c.name}
              </Checkbox>
            ))}
          </div>
          <h4 className="text-center mt-4">Filter By Price</h4>
          <div className="d-flex flex-column">
            <Radio.Group
              value={radio ?? undefined}
              onChange={(e) => {
                setRadio(e.target.value);
                setPage(1);
              }}
            >
              {Prices?.map((p) => (
                <div key={p._id}>
                  <Radio value={p.array}>{p.name}</Radio>
                </div>
              ))}
            </Radio.Group>
          </div>
          <div className="d-flex flex-column">
            <button
              className="btn btn-danger"
              onClick={() => {
                setChecked([]);
                setRadio(null);
                setPage(1);
                getAllProducts(1, true);
                getTotal();
              }}
            >
              RESET FILTERS
            </button>
          </div>
        </div>
        <div className="col-md-9 ">
          <h1 className="text-center">All Products</h1>
          <div className="d-flex flex-wrap">
            {products?.map((p) => {
              const name = asString(p?.name);
              const desc = asString(p?.description);
              const priceNum = asNumber(p?.price);
              return (
                <div className="card m-2" key={p._id} data-id={p._id}>
                  <img
                    src={`/api/v1/product/product-photo/${p._id}`}
                    className="card-img-top"
                    alt={name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/placeholder.png";
                    }}
                  />
                  <div className="card-body">
                    <div className="card-name-price">
                      <h5 className="card-title">{name}</h5>
                      <h5 className="card-title card-price" data-testid="price">
                        {priceNum.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </h5>
                    </div>
                    <p className="card-text ">{desc.substring(0, 60)}...</p>
                    <div className="card-name-price">
                      <button
                        className="btn btn-info ms-1"
                        onClick={() => navigate(`/product/${p.slug}`)}
                      >
                        More Details
                      </button>
                      <button
                        className="btn btn-dark ms-1"
                        onClick={() => {
                          setCart([...cart, p]);
                          localStorage.setItem("cart", JSON.stringify([...cart, p]));
                          toast.success("Item Added to cart");
                        }}
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="m-2 p-3">
            {products &&
              products.length < total &&
              checked.length === 0 &&
              !radio && (
                <button
                  className="btn loadmore"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((x) => x + 1);
                  }}
                >
                  {loading ? (
                    "Loading ..."
                  ) : (
                      "Load more"
                  )}
                </button>
              )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
