# Africa Marketplace — Database Architecture

## 1. Design Goal

The database must support a secure, scalable, multi-vendor marketplace.

The architecture must allow:

- Many customers
- Many vendors
- Many vendor stores
- Many products
- One customer cart containing products from multiple vendors
- One checkout producing multiple vendor-specific orders
- Payments and commissions
- Vendor payouts
- Inventory management
- Reviews
- Promotions
- AI-related platform features
- Future expansion across multiple African countries

---

## 2. Core Relationship Model

User
|
+-- Customer
|
+-- Vendor
|    |
|    +-- VendorVerification
|    |
|    +-- Store
|         |
|         +-- Products
|         +-- Inventory
|
+-- Admin


Customer
|
+-- Cart
|    |
|    +-- CartItems
|         |
|         +-- Product
|         +-- Vendor
|
+-- Orders
     |
          +-- VendorOrders
                    |
                              +-- OrderItems
                                        |
                                                  +-- Vendor


                                                  Product
                                                  |
                                                  +-- ProductVariant
                                                  +-- Inventory
                                                  +-- Category
                                                  +-- Reviews
                                                  +-- Promotions


                                                  Order
                                                  |
                                                  +-- VendorOrders
                                                  +-- Payment
                                                  +-- Delivery
                                                  +-- Refunds


                                                  VendorOrder
                                                  |
                                                  +-- Vendor
                                                  +-- OrderItems
                                                  +-- Fulfillment
                                                  +-- Commission
                                                  +-- Payout