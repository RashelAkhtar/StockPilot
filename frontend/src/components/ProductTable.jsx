import {flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import "../styles/ProductTable.css";
import Modal from './Modal';

function ProductTable () {
    const API = import.meta.env.VITE_API;

    const [data, setData] = useState([]);
    const [soldData, setSoldData] = useState([]);
    const [mergedData, setMergedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, title: '', message: '' });
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, productName: "" });
    const [sorting, setSorting] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    // Fetch product
    const fetchProduct = async () => {
        try {
            const res = await fetch(`${API}/api/product`, { credentials: "include" });
            const json = await res.json();

            // backend returns rows with snake_case column names; map to frontend keys
            const rows = (Array.isArray(json) ? json : json.data || [])
                .map((r) => ({
                    id: r.id,
                    productName: r.product_name ?? r.productName,
                    buyingPrice: r.buying_price ?? r.buyingPrice,
                    productQty: r.quantity ?? r.productQty,
                }));

            setData(rows);
        } catch (err) {
            console.log("Failed to fetch product: ", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch sold product info
    const fetchSoldDetails = async () => {
        try {
            const res = await fetch(`${API}/api/sales`, { credentials: "include" });
            const json = await res.json();

            const rows = (Array.isArray(json) ? json: json.data || [])
                .map((r) => ({
                    id: r.product_id ?? r.id,
                    sellingPrice: r.selling_price ?? r.sellingPrice,
                    quantitySold: r.quantity ?? r.quantitySold,
                    profitPerUnit: r.profit_per_unit ?? r.profitPerUnit,
                    totalProfit: r.total_profit ?? r.totalProfit,
                    sold_at: r.sold_at ?? r.soldAt,
                    __raw: r,
                }));

            setSoldData(rows);
        } catch (err) {
            console.log("Failed to fetch sold information: ", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProduct();
        fetchSoldDetails();

        // listen for new products being added or sold and refresh
        const onAdded = () => fetchProduct();
        const onSold = () => fetchSoldDetails();
        window.addEventListener("product:added", onAdded);
        window.addEventListener("product:sold", onSold);
        return () => {
            window.removeEventListener("product:added", onAdded);
            window.removeEventListener("product:sold", onSold);
        };
    }, []);

    // whenever products or sales change, merge them
    useEffect(() => {
        // map product id -> aggregated sales
        const salesByProduct = {};
        for (const s of soldData) {
            const pid = String(s.id ?? s.product_id ?? s.__raw?.product_id);
            if (!salesByProduct[pid]) salesByProduct[pid] = [];
            salesByProduct[pid].push(s);
        }

        const merged = data.map((p, index) => {
            // Ensure ID is always present - use index as fallback if id is missing
            const productId = p.id !== undefined && p.id !== null ? p.id : index + 1;
            const pid = String(productId);
            const sales = salesByProduct[pid] || [];
            // compute total sold and profit aggregates
            const totalSold = sales.reduce((sum, s) => sum + Number(s.quantitySold ?? s.quantity ?? 0), 0);
            const totalProfit = sales.reduce((sum, s) => sum + Number(s.totalProfit ?? s.total_profit ?? 0), 0);
            let latestProfitPerUnit = '';
            if (sales.length > 0) {
                sales.sort((a,b) => new Date(b.sold_at || b.__raw?.sold_at || 0) - new Date(a.sold_at || a.__raw?.sold_at || 0));
                latestProfitPerUnit = sales[0].profitPerUnit ?? sales[0].profit_per_unit ?? '';
            }
            return {
                id: productId,
                productName: p.productName || '',
                buyingPrice: p.buyingPrice || 0,
                productQty: p.productQty || 0,
                profitPerUnit: latestProfitPerUnit || '-',
                totalProfit: totalProfit || 0,
                quantitySold: totalSold || 0,
            };
        });

        setMergedData(merged);
    }, [data, soldData]);


    // DELETE product
    const handleDelete = async (id) => {
        try {
            console.log("Attempting delete for id:", id);
            const res = await fetch(`${API}/api/product/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = json?.err || json?.message || "Delete failed";
                throw new Error(msg);
            }

            // Update UI (coerce to string to avoid type mismatch)
            setData((prev) => prev.filter((item) => String(item.id) !== String(id)));

            // show server message if present
            setModal({ open: true, title: 'Deleted', message: json?.message || 'Product deleted' });
        } catch (err) {
            setModal({ open: true, title: 'Error', message: "Error deleting record: " + (err.message || err) });
            console.error(err);
        }
    }

    const openDeleteModal = (product) => {
        setDeleteModal({
            open: true,
            id: product.id,
            productName: product.productName || "this product",
        });
    };

    const confirmDelete = async () => {
        const id = deleteModal.id;
        setDeleteModal({ open: false, id: null, productName: "" });
        if (id == null) return;
        await handleDelete(id);
    };

    // Debounce search input so we don't re-filter on every keystroke
    useEffect(() => {
        const handle = setTimeout(() => {
            setSearch(searchInput.trim());
        }, 250);
        return () => clearTimeout(handle);
    }, [searchInput]);

    // Filtered data based on search term (product name)
    const filteredData = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return mergedData;
        return mergedData.filter((row) => {
            const name = String(row.productName || '').toLowerCase();
            return name.includes(term);
        });
    }, [mergedData, search]);

    const columns = [
        // Serial number column (1,2,3,...) that always follows the visible order
        // This does NOT use the database id, only the row index from React Table.
        {
            id: "serial",
            header: "S/N",
            enableSorting: false,
            cell: (info) => {
                const { pageIndex, pageSize } = info.table.getState().pagination;
                // Global row number across pages
                return pageIndex * pageSize + info.row.index + 1;
            },
        },
        // {
        //     id: "id",
        //     accessorKey: "id",
        //     header: "ID",
        //     cell: (info) => {
        //         const value = info.getValue();
        //         return value !== null && value !== undefined ? String(value) : '';
        //     }
        // },
        {
            id: "productName",
            accessorKey: "productName",
            header: "Name",
            cell: (info) => info.getValue() || ''
        },
        {
            id: "buyingPrice",
            accessorKey: "buyingPrice",
            header: "Buying Price",
            cell: (info) => {
                const value = info.getValue();
                return value !== null && value !== undefined ? value : 0;
            }
        },
        {
            id: "productQty",
            accessorKey: "productQty",
            header: "Quantity",
            cell: (info) => {
                const value = info.getValue();
                return value !== null && value !== undefined ? value : 0;
            }
        },
        {
            id: "profitPerUnit",
            accessorKey: "profitPerUnit",
            header: "Profit Per Unit",
            cell: (info) => {
                const value = info.getValue();
                return value !== null && value !== undefined && value !== '' ? value : '-';
            }
        },
        {
            id: "quantitySold",
            accessorKey: "quantitySold",
            header: "Quantity Sold",
            cell: (info) => {
                const value = info.getValue();
                return value !== null && value !== undefined ? value : 0;
            }
        },
        {
            id: "totalProfit",
            accessorKey: "totalProfit",
            header: "Total Profit",
            cell: (info) => {
                const value = info.getValue();
                return value !== null && value !== undefined ? value : 0;
            }
        },
        {
            id: "actions",
            header: "Actions",
            enableSorting: false,
            cell: (info) => (
                <button className="btn danger" onClick={() => openDeleteModal(info.row.original)}>DELETE</button>
            )
        }
    ];

    const table = useReactTable({
        data: filteredData,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    if (loading) return <p className="loading">Loading...</p>;


    return(
        <div className="product-table page">
        <h2 className="page-title">Product Table</h2>

        <div className="table-toolbar" style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Sort by</label>
                <select
                    value={sorting.length ? sorting[0].id : ''}
                    onChange={(e) => {
                        const col = e.target.value;
                        if (!col) {
                            setSorting([]);
                            return;
                        }
                        setSorting([{ id: col, desc: false }]);
                    }}
                    className="input"
                    style={{ width: 220 }}
                >
                    <option value="">-- none --</option>
                    {columns.filter(c => c.id !== 'actions' && c.id !== 'serial').map(c => (
                        <option key={c.id} value={c.id}>{typeof c.header === 'string' ? c.header : c.id}</option>
                    ))}
                </select>

                <button className="btn" onClick={() => {
                    if (!sorting.length) return;
                    const cur = sorting[0];
                    setSorting([{ id: cur.id, desc: !cur.desc }]);
                }}>{sorting.length && sorting[0].desc ? 'Sort 🔽' : 'Sort 🔼'}</button>

                <button className="btn" onClick={() => setSorting([])}>Clear</button>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
                <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Search</label>
                <input
                    type="text"
                    className="input"
                    placeholder="Search by name..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={{ minWidth: 220 }}
                />
            </div>
        </div>

        <div className="table-wrapper">
            <table className="table">
                <thead>
                    {table.getHeaderGroups().map((group) => (
                        <tr key={group.id}>
                            {group.headers.map((header) => (
                                <th
                                    key={header.id}
                                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                        {/* sort indicator */}
                                        {header.column.getCanSort() ? (
                                            <span style={{ fontSize: 12, opacity: 0.8 }}>
                                                {header.column.getIsSorted() === 'asc' ? ' 🔼' : header.column.getIsSorted() === 'desc' ? ' 🔽' : ''}
                                            </span>
                                        ) : null}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>

                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id}>
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

    <div className="pagination">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
    </button>

        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
        <Modal open={modal.open} title={modal.title} onClose={() => setModal({ ...modal, open: false })}>
            <div>{modal.message}</div>
        </Modal>
        <Modal
            open={deleteModal.open}
            title="Delete Product"
            variant="error"
            primaryLabel="Delete"
            secondaryLabel="Cancel"
            onPrimary={confirmDelete}
            onSecondary={() => setDeleteModal({ open: false, id: null, productName: "" })}
            onClose={() => setDeleteModal({ open: false, id: null, productName: "" })}
        >
            <div>
                Are you sure you want to delete <strong>{deleteModal.productName}</strong>?
                This action cannot be undone.
            </div>
        </Modal>
        </div>
    )
}

export default ProductTable;
