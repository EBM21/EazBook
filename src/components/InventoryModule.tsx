import React, { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Loader2,
  ScanBarcode,
  Box,
  Tag,
  ArrowUpRight,
  Edit2,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/src/lib/auth";
import BarcodeScanner from "@/src/components/BarcodeScanner";
import BulkImportButton from "@/src/components/BulkImportButton";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  min_stock_level: number;
  created_at: string;
}

export default function InventoryModule() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    sku: "",
    name: "",
    category: "Electronics",
    price: "",
    stockQuantity: "",
    minStockLevel: "10"
  });
  const [submitting, setSubmitting] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/inventory/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory/products", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price) || 0,
          stock_quantity: parseInt(newProduct.stockQuantity) || 0,
          min_stock_level: parseInt(newProduct.minStockLevel) || 10
        }),
      });
      if (res.ok) {
        const addedProduct = await res.json();
        setProducts(prev => [...prev, addedProduct]);
        setIsAddProductOpen(false);
        setNewProduct({
          sku: "",
          name: "",
          category: "Electronics",
          price: "",
          stockQuantity: "",
          minStockLevel: "10"
        });
      }
    } catch (error) {
      console.error("Failed to add product:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          sku: selectedProduct.sku,
          name: selectedProduct.name,
          category: selectedProduct.category,
          price: parseFloat(selectedProduct.price.toString()) || 0,
          stock_quantity: parseInt(selectedProduct.stock_quantity.toString()) || 0,
          min_stock_level: parseInt(selectedProduct.min_stock_level.toString()) || 10
        }),
      });
      if (res.ok) {
        const updatedProduct = await res.json();
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        setIsEditProductOpen(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error("Failed to update product:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      // Optimistic update
      setProducts(prev => prev.filter(p => p.id !== productId));

      const res = await fetch(`/api/inventory/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        // Revert if failed
        fetchProducts();
        console.error("Failed to delete product");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      fetchProducts();
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsEditProductOpen(true);
  };

  const handleScan = (sku: string) => {
    setSearchQuery(sku);
    setShowScanner(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock_quantity <= (p.min_stock_level || 10));

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground font-medium">Track stock levels, manage products, and automate reordering.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <BulkImportButton 
            endpoint="/api/inventory/products/bulk"
            onSuccess={fetchProducts}
            mapping={{
              "Name": "name",
              "SKU": "sku",
              "Category": "category",
              "Price": "price",
              "Stock": "stockQuantity",
              "Min Stock": "minStockLevel"
            }}
          />
          <Button 
            variant="outline" 
            onClick={() => setShowScanner(true)}
            className="rounded-xl border-border bg-card font-bold flex-1 md:flex-none"
          >
            <ScanBarcode className="w-4 h-4 mr-2" />
            Scan SKU
          </Button>
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger render={
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 font-bold flex-1 md:flex-none">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] bg-card border-border p-0 overflow-hidden shadow-2xl">
              <div className="bg-primary/5 p-8 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-foreground">Add New Product</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Register a new item in your inventory system.</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleAddProduct} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">SKU / Barcode</Label>
                    <div className="relative">
                      <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input 
                        id="sku" 
                        placeholder="PROD-001" 
                        value={newProduct.sku}
                        onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Category</Label>
                    <Select 
                      value={newProduct.category} 
                      onValueChange={v => setNewProduct({...newProduct, category: v})}
                    >
                      <SelectTrigger className="rounded-xl border-border bg-muted/30 h-12">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-xl">
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Product Name</Label>
                  <div className="relative">
                    <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input 
                      id="name" 
                      placeholder="MacBook Pro M3" 
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Unit Price ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input 
                        id="price" 
                        type="number" 
                        placeholder="1999" 
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Initial Stock</Label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input 
                        id="stockQuantity" 
                        type="number" 
                        placeholder="50" 
                        value={newProduct.stockQuantity}
                        onChange={e => setNewProduct({...newProduct, stockQuantity: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStockLevel" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Min Stock Level (Alert Threshold)</Label>
                  <div className="relative">
                    <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input 
                      id="minStockLevel" 
                      type="number" 
                      placeholder="10" 
                      value={newProduct.minStockLevel}
                      onChange={e => setNewProduct({...newProduct, minStockLevel: e.target.value})}
                      required
                      className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add to Inventory"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] bg-card border-border p-0 overflow-hidden shadow-2xl">
              <div className="bg-primary/5 p-8 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-foreground">Edit Product</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Update product details and stock levels.</p>
                  </div>
                </div>
              </div>
              {selectedProduct && (
                <form onSubmit={handleEditProduct} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-sku" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">SKU / Barcode</Label>
                      <div className="relative">
                        <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input 
                          id="edit-sku" 
                          value={selectedProduct.sku ?? ""}
                          onChange={e => setSelectedProduct({...selectedProduct, sku: e.target.value})}
                          required
                          className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Category</Label>
                      <Select 
                        value={selectedProduct.category ?? "Electronics"} 
                        onValueChange={v => setSelectedProduct({...selectedProduct, category: v})}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-muted/30 h-12">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-xl">
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Furniture">Furniture</SelectItem>
                          <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                          <SelectItem value="Software">Software</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Product Name</Label>
                    <div className="relative">
                      <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input 
                        id="edit-name" 
                        value={selectedProduct.name ?? ""}
                        onChange={e => setSelectedProduct({...selectedProduct, name: e.target.value})}
                        required
                        className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-price" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Unit Price ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input 
                          id="edit-price" 
                          type="number" 
                          value={selectedProduct.price ?? 0}
                          onChange={e => setSelectedProduct({...selectedProduct, price: parseFloat(e.target.value) || 0})}
                          required
                          className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-stockQuantity" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Stock Quantity</Label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input 
                          id="edit-stockQuantity" 
                          type="number" 
                          value={selectedProduct.stock_quantity ?? 0}
                          onChange={e => setSelectedProduct({...selectedProduct, stock_quantity: parseInt(e.target.value) || 0})}
                          required
                          className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-minStockLevel" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Min Stock Level (Alert Threshold)</Label>
                    <div className="relative">
                      <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input 
                        id="edit-minStockLevel" 
                        type="number" 
                        value={selectedProduct.min_stock_level ?? 0}
                        onChange={e => setSelectedProduct({...selectedProduct, min_stock_level: parseInt(e.target.value) || 10})}
                        required
                        className="rounded-xl border-border bg-muted/30 focus:bg-background pl-10 h-12 transition-all"
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-border shadow-sm rounded-2xl bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Stock Value</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${products.reduce((acc, p) => acc + (Number(p.price) * p.stock_quantity), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{products.length} unique products</p>
          </CardContent>
        </Card>
        <Card className={`border-border shadow-sm rounded-2xl ${lowStockProducts.length > 0 ? "bg-red-500/10 border-red-500/20" : "bg-card"}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${lowStockProducts.length > 0 ? "text-red-500" : "text-muted-foreground"}`}>Low Stock Alerts</span>
              <AlertTriangle className={`w-4 h-4 ${lowStockProducts.length > 0 ? "text-red-500" : "text-muted-foreground/60"}`} />
            </div>
            <div className={`text-2xl font-bold ${lowStockProducts.length > 0 ? "text-red-600" : "text-foreground"}`}>
              {lowStockProducts.length} Items
            </div>
            <p className={`text-xs mt-1 ${lowStockProducts.length > 0 ? "text-red-500/80" : "text-muted-foreground"}`}>
              {lowStockProducts.length > 0 ? "Requires immediate attention" : "All levels healthy"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm rounded-2xl bg-slate-900 dark:bg-slate-800 text-white sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Stock Turnover</span>
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold">4.2x</div>
            <p className="text-xs text-slate-400 mt-1">+0.5x from last quarter</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
        <CardHeader className="border-b border-border bg-muted/30 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search products, SKU, category..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl border-border bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-lg border-border text-xs font-bold">
                <Filter className="w-3 h-3 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No products found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or add a new product.</p>
              <Button onClick={() => setIsAddProductOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">Add Product</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Product</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">SKU</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Stock</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Price</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground/60 shrink-0">
                            <Box className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-foreground truncate">{product.name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <Tag className="w-3 h-3" />
                              {product.category}
                            </div>
                            <span className="text-[10px] text-muted-foreground/60 sm:hidden">{product.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">{product.sku}</code>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className={`text-sm font-bold ${product.stock_quantity <= (product.min_stock_level || 10) ? 'text-red-500' : 'text-foreground'}`}>
                            {product.stock_quantity} units
                          </span>
                          <div className="w-20 bg-muted h-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${product.stock_quantity <= (product.min_stock_level || 10) ? "bg-red-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(100, (product.stock_quantity / ((product.min_stock_level || 10) * 2)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-sm font-bold text-foreground">${Number(product.price).toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border rounded-xl shadow-xl">
                            <DropdownMenuItem 
                              onClick={() => openEditDialog(product)}
                              className="flex items-center gap-2 cursor-pointer focus:bg-muted"
                            >
                              <Edit2 className="w-4 h-4 text-blue-500" />
                              <span>Edit Product</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="flex items-center gap-2 cursor-pointer focus:bg-red-500/10 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Product</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
