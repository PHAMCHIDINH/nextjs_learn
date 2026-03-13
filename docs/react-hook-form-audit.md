# React Hook Form Audit

## Mục tiêu
- Xác định luồng nhập liệu nào nên giữ `useState`.
- Xác định luồng nào nên chuyển sang `react-hook-form` để giảm state thủ công, chuẩn hóa validation và reset.
- Tạo backlog ưu tiên rõ ràng cho các bước tiếp theo.

## Ma trận audit
| Khu vực | File | Trạng thái | Quyết định | Lý do |
| --- | --- | --- | --- | --- |
| Auth login/register/otp | `src/modules/auth/pages/AuthPage.tsx` | Đã dùng RHF | Giữ RHF, tiếp tục chuẩn hóa | Có validation, touched state, reset OTP, submit state |
| Dashboard profile edit | `src/modules/dashboard/pages/DashboardPage.tsx` | Đã dùng RHF | Giữ RHF, tiếp tục chuẩn hóa | Có dirty check, validation, reset theo user hiện tại |
| Tạo/sửa bài đăng | `src/modules/post/pages/NewPostPage.tsx`, `src/modules/post/pages/EditPostPage.tsx`, `src/modules/post/components/ListingEditorForm.tsx` | Đã dùng RHF | Giữ RHF, refactor về form context | Trước đây prop-drilling lớn, nhiều boilerplate lỗi/select |
| Report dialog | `src/components/report-dialog.tsx` | Đã dùng RHF | Giữ RHF | Form nhỏ, rõ ràng, đủ lợi ích |
| Marketplace filters | `src/modules/marketplace/pages/MarketplacePage.tsx` | Trước đây dùng nhiều `useState` | Đã chuyển sang RHF | Có nhiều field liên quan nhau, clear/reset, serialize query params |
| Chat composer | `src/modules/chat/pages/ChatPage.tsx` | Trước đây dùng `useState` | Đã chuyển sang RHF cho composer | Có validate text/image, reset sau submit, lỗi file |
| Chat sidebar search | `src/modules/chat/pages/ChatPage.tsx` | `useState` | Giữ `useState` | Filter tức thời 1 field, không cần submit/reset phức tạp |
| View mode / sheet open / loading / socket / mute | nhiều file | `useState` | Giữ `useState` | Đây là UI state, không phải form state |

## Những gì đã làm trong đợt này
- Thêm shared RHF helpers tại `src/shared/ui/form.tsx` cho:
  - `Input`
  - `Select`
  - `InputOTP`
  - `CheckboxGroup`
  - `Slider`
  - rule hiển thị lỗi theo `touched || submit`
- Chuyển `MarketplacePage` sang 1 RHF form duy nhất với `useWatch` và debounce 300ms giữ nguyên.
- Chuyển chat composer sang RHF với schema `chatComposerSchema`.
- Refactor listing editor sang `FormProvider` + `useFormContext` để bỏ truyền `control/register/setValue/errors/touchedFields/submitCount` qua props.
- Chuẩn hóa một phần `Dashboard` và `Auth` để bắt đầu dùng helper mới.

## Backlog
### P1
- Áp dụng helper `RHFInput`/`FormFieldErrorMessage` sâu hơn cho `AuthPage` để giảm logic lỗi lặp lại ở email/password/name/studentId.
- Chuẩn hóa thêm các form nhỏ còn đang dùng `FieldError` thủ công nhưng cùng pattern.

### P2
- Tách một số section form lớn thành component con dùng `useFormContext` để giảm độ dài file `AuthPage` và `DashboardPage`.
- Cân nhắc tạo wrapper field-level cho `Textarea` và currency input nếu pattern lặp lại thêm.

### P3
- Nếu cần đồng bộ sâu hơn với URL, có thể nối `MarketplacePage` filters với search params theo 2 chiều.
- Nếu chat composer phát sinh thêm message type hoặc attachment type, mở rộng `chatComposerSchema` thay vì quay lại `useState` rời.

## Nguyên tắc giữ nguyên
- Không dùng RHF để thay thế toàn bộ UI state.
- Không thay đổi API backend hoặc payload business logic.
- Chỉ chuyển sang RHF khi có lợi ích thực tế về validation, reset, touched/dirty state hoặc giảm boilerplate đáng kể.
