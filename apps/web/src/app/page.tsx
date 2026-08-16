import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export default function Home() {
  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Quiz Platform</h1>
        <Badge variant="secondary">Emerald + Mist</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bắt đầu bài thi</CardTitle>
          <CardDescription>Kiểm tra hoạt động của theme và các UI components.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>Bắt đầu ngay (Primary)</Button>
          <Button variant="secondary">Xem kết quả</Button>
          <Button variant="outline">Cấu hình</Button>
          <Button variant="destructive">Hủy bài</Button>
        </CardContent>
      </Card>
    </main>
  );
}
