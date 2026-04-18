# Spare Driver Pivot - Phase 1 Quarantine List

This list tracks legacy modules that are no longer part of active routing after Phase 1.
These files should stay untouched in quarantine until we run Phase 2 (archive/remove pass).

## Consumer Legacy Flows (Not Routed)

- `Frontend/src/modules/consumer/pages/ApartmentWash.jsx`
- `Frontend/src/modules/consumer/pages/ApartmentWashHistory.jsx`
- `Frontend/src/modules/consumer/pages/ApartmentWashSupport.jsx`
- `Frontend/src/modules/consumer/pages/InstantWash.jsx`
- `Frontend/src/modules/consumer/pages/FullWashBooking.jsx`
- `Frontend/src/modules/consumer/pages/StudioDiscovery.jsx`
- `Frontend/src/modules/consumer/pages/BookingType.jsx`
- `Frontend/src/modules/consumer/pages/BookingStatus.jsx`
- `Frontend/src/modules/consumer/pages/BookingConfirmation.jsx`
- `Frontend/src/modules/consumer/pages/ServiceSelection.jsx`
- `Frontend/src/modules/consumer/pages/MapScreen.jsx`
- `Frontend/src/modules/consumer/pages/OrderTracking.jsx`
- `Frontend/src/modules/consumer/pages/MyOrders.jsx`
- `Frontend/src/modules/consumer/pages/EShop.jsx`
- `Frontend/src/modules/consumer/pages/CartPage.jsx`
- `Frontend/src/modules/consumer/pages/Wishlist.jsx`
- `Frontend/src/modules/consumer/pages/WashAndCare.jsx`
- `Frontend/src/modules/consumer/pages/Subscriptions.jsx`
- `Frontend/src/modules/consumer/pages/ModelDetail.jsx`
- `Frontend/src/modules/consumer/pages/PaymentCheckout.jsx`

## Rule For Phase 2

- Keep these files out of navigation and route config.
- Do not delete shared utilities until import graph is rechecked.
- Remove only after static import check confirms no active spare-driver dependency.
