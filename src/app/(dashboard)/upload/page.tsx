import { prisma } from "@/lib/prisma";
import { UploadDropzone } from "@/components/inventory/UploadDropzone";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  COMPLETED: "default",
  PROCESSING: "secondary",
  PENDING: "outline",
  FAILED: "destructive",
};

export default async function UploadPage() {
  const recentUploads = await prisma.inventoryUpload.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="container mx-auto max-w-3xl space-y-8 py-8 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Inventory</h1>
        <p className="text-muted-foreground">
          Upload a JSON file containing your systems inventory to map
          dependencies.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Drag &amp; drop or click to browse for a JSON inventory file (max
            5&nbsp;MB).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadDropzone />
        </CardContent>
      </Card>

      {recentUploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Last 10 inventory uploads</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Systems</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">
                      {upload.filename}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[upload.status] ?? "outline"}
                      >
                        {upload.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {upload.systemsCount}
                    </TableCell>
                    <TableCell>
                      {upload.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
