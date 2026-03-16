'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const Schema = z.object({
  title: z.string().min(1, '제목은 필수입니다').max(10, '10자 이하만'),
})

type Values = z.infer<typeof Schema>

export default function MyForm() {
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { title: '' },
    mode: 'onChange',
  })

  const onSubmit = (values: Values) => {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목</FormLabel>
              <FormControl>
                <Input placeholder="제목 입력" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button onClick={() => form.reset({ title: 'reseted' })}></Button>
        <Button type="submit">저장</Button>
        {form.formState.isDirty && <p>dirty!</p>}
      </form>
    </Form>
  )
}
