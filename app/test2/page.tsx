"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

//
// ✅ 1️⃣ Validation Schema (🔥 UI 에러용)
//

const validationSchema = z.object({
  title: z.string().min(1, "Title required"),

  tags: z
    .string()
    .min(1, "Tags required")
    .refine(val => {
      const arr = val
        .split(/\s+/)
        .map(v => v.trim())
        .filter(Boolean)

      return arr.length >= 5
    }, {
      message: "Minimum 5 tags required",
    })
    .refine(val => {
      const arr = val
        .split(/\s+/)
        .map(v => v.trim())
        .filter(Boolean)

      return arr.length <= 10
    }, {
      message: "Maximum 10 tags allowed",
    }),
})

//
// ✅ 2️⃣ Transform Schema (🔥 저장용)
//

const transformSchema = z.object({
  title: z.string(),
  tags: z.string(),
}).transform(data => ({
  ...data,
  tags: [...new Set(
    data.tags
      .split(/\s+/)
      .map(v => v.trim())
      .filter(Boolean)
  )],
}))

//
// ✅ 타입 (💯 안정)
//

type FormInput = z.infer<typeof validationSchema>

export default function PostForm() {

  const form = useForm<FormInput>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      title: "",
      tags: "",
    },
  })

  async function onSubmit(values: FormInput) {

    const parsed = transformSchema.parse(values)

    await fetch("/api/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Post title" {...field} />
              </FormControl>
              <FormMessage />   {/* ✅ 빨간 에러 */}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input
                  placeholder="react nextjs prisma zod shadcn"
                  {...field}
                />
              </FormControl>
              <FormMessage />   {/* ✅ 빨간 에러 정상 작동 */}
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}